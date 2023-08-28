import { ChildProcess } from "child_process";

(function() {
  const
    os = require("os"),
    isWindows = os.platform() === "win32",
    which = requireModule<Which>("which"),
    createTempFile = requireModule<CreateTempFile>("create-temp-file"),
    quoteIfRequired = requireModule<QuoteIfRequired>("quote-if-required"),
    SpawnError = requireModule<SpawnError>("spawn-error"),
    LineBuffer = requireModule<LineBuffer>("line-buffer"),
    child_process = require("child_process"),
    SpawnResult = requireModule<SpawnResult>("spawn-result");

  interface StdIoCollectors {
    stdout: string[];
    stderr: string[];
  }

  interface SpawnOptionsWithContext extends SpawnOptions {
    collectors: StdIoCollectors;
  }

  function fillOut(opts?: SpawnOptions): SpawnOptionsWithContext {
    const result = (opts || {}) as SpawnOptionsWithContext;
    result.collectors = {
      stdout: [] as string[],
      stderr: [] as string[]
    };
    return result;
  }

  async function system(
    program: string,
    args?: string[],
    options?: SystemOptions
  ): Promise<SpawnResult> {
    let alreadyExited = false;
    const opts = fillOut(options);
    if (opts.suppressOutput === undefined) {
      opts.suppressOutput = !!opts.stderr || !!opts.stdout;
    }
    let
      exe = program as Nullable<string>,
      programArgs = args || [] as string[];
    if (!which(program) && !args) {
      // assume it's a long commandline
      const search = isWindows
        ? "cmd.exe"
        : "sh";
      exe = which(search);
      if (!exe) {
        throw new SpawnError(
          `Unable to find system shell '${ search }' in path`,
          program,
          args || [],
          -1,
          [],
          []
        );
      }
      const tempFileContents = [ program ].concat(
        programArgs.map(quoteIfRequired)
      ).join(" ");
      const pre = isWindows
        ? "@echo off"
        : "";
      const tempFile = await createTempFile(
        `
${ pre }
${ tempFileContents }
        `.trim()
      );
      debugger;
      programArgs = isWindows
        ? [ "/c" ]
        : [];
      programArgs.push(tempFile.path);
    }
    const result = new SpawnResult(`${ exe }`, programArgs, -1, [], []);
    return new Promise<SpawnResult>((resolve, reject) => {
      const child = child_process.spawn(
        exe,
        programArgs, {
          windowsHide: opts.windowsHide,
          windowsVerbatimArguments: opts.windowsVerbatimArguments,
          timeout: opts.timeout,
          cwd: opts.cwd,
          argv0: opts.argv0,
          shell: opts.shell,
          uid: opts.uid,
          gid: opts.gid,
          env: opts.env || process.env,
          detached: opts.detached || false,
          stdio: [
            "inherit",
            opts.interactive ? "inherit" : "pipe",
            opts.interactive ? "inherit" : "pipe"
          ]
        }
      );
      child.on("error", handleError);
      child.on("exit", handleExit.bind(null, "exit"));
      child.on("close", handleExit.bind(null, "close"));
      const stdoutFn = typeof opts.stdout === "function" ? opts.stdout : noop;
      const stderrFn = typeof opts.stderr === "function" ? opts.stderr : noop;
      const
        stdoutLineBuffer = new LineBuffer(s => {
          result.stdout.push(s);
          stdoutFn(s);
          if (opts.suppressOutput) {
            return;
          }
          console.log(s);
        }),
        stderrLineBuffer = new LineBuffer(s => {
          result.stderr.push(s);
          stderrFn(s);
          if (opts.suppressOutput) {
            return;
          }
          console.error(s);
        });
      child.stdout.on("data", handleStdIo(stdoutLineBuffer, opts));
      child.stderr.on("data", handleStdIo(stderrLineBuffer, opts));

      function handleError(e: string) {
        if (hasExited()) {
          return;
        }
        return reject(generateError(
          `Error spawning process: ${ e }`
        ));
      }

      function handleExit(
        ctx: string,
        code: number
      ) {
        if (hasExited()) {
          return;
        }
        if (code) {
          const errResult = generateError(
            `Process exited (${ ctx }) with non-zero code: ${ code }`,
            code
          );
          return reject(errResult);
        }
        result.exitCode = code;
        return resolve(result);
      }

      function generateError(
        message: string,
        exitCode?: number
      ) {
        return new SpawnError(
          message,
          program,
          args,
          exitCode ?? -1,
          result.stdout,
          result.stderr
        );
      }

      function hasExited() {
        if (alreadyExited) {
          return true;
        }
        flushBuffers();
        destroyPipesOn(child);
        alreadyExited = true;
        return false;
      }

      function flushBuffers() {
        if (stderrLineBuffer) {
          stderrLineBuffer.flush();
        }
        if (stdoutLineBuffer) {
          stdoutLineBuffer.flush();
        }
      }
    });
  }

  function handleStdIo(
    lineBuffer: LineBuffer,
    opts: SpawnOptions
  ): ((data: Buffer) => void) {
    return (d: Buffer) => {
      lineBuffer.append(d);
    };
  }

  function noop(data: string | Buffer) {
  }

  function destroyPipesOn(child: ChildProcess) {
    for (const pipe of [ child.stdout, child.stderr, child.stdin ]) {
      if (pipe) {
        try {
          // I've seen times when child processes are dead, but the
          // IO pipes are kept alive, preventing node from exiting.
          // Specifically, when running dotnet test against a certain
          // project - but not in any other project for the same
          // usage. So this is just a bit of paranoia here - explicitly
          // shut down any pipes on the child process - we're done
          // with them anyway
          pipe.destroy();
        } catch (e) {
          // suppress: if the pipe is already dead, that's fine.
        }
      }
    }
  }

  module.exports = system;
})();
