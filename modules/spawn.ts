import { Readable } from "stream";
import { ChildProcess } from "child_process";
import { reset } from "ansi-colors";

(function() {
  const LineBuffer = requireModule<LineBuffer>("line-buffer");
// use for spawning actual processes.
// You must use exec if you want to run batch files
  const SpawnError = requireModule<SpawnError>("spawn-error");
  const SpawnResult = requireModule<SpawnResult>("spawn-result");
  const tryLoadDebug = function() {
      try {
        return requireModule<DebugFactory>("debug")(__filename);
      } catch (e) {
        return function() {
        };
      }
    },
    quoteIfRequired = require("./quote-if-required"),
    debug = tryLoadDebug(),
    readline = require("readline"),
    child_process = require("child_process");
  function clean(data: string): string {
    return (data || "").replace(/\s+$/, "");
  }
  interface AugmentedLogFunction extends LogFunction {
    flush(): void;
  }

  function createEcho(
    writer: LogFunction
  ): AugmentedLogFunction {
    const buffer = new LineBuffer(writer);
    const result = ((s: string) => {
      buffer.append(s);
    }) as AugmentedLogFunction;
    result.flush = () => buffer.flush();
    return result;
  }

  const defaultOptions = {
    stdio: [ process.stdin, process.stdout, process.stdin ] as StdioOptions,
    cwd: process.cwd(),
    shell: true,
    lineBuffer: true,
    // default is to echo outputs via a LineBuffer instance
    // -> given captured console.xxx because then we can still
    //    spy and suppress and so on in tests
    stderr: createEcho(s => console.log(s)) as Optional<ProcessIO>,
    stdout: createEcho(s => console.error(s)) as Optional<ProcessIO>
  };

  // noinspection JSUnusedLocalSymbols
  function nullConsumer(str: string) {
    // intentionally left blank
  }

  function spawn(
    executable: string,
    commandlineArgs?: string[],
    options?: SpawnOptions
  ): Promise<SpawnResult> {
    const isShellExec = commandlineArgs === undefined || commandlineArgs === null;
    let args = commandlineArgs || [];
    if (isShellExec) {
      debug("is shell exec");
      debug({
        executable
      });
      const
        os = require("os"),
        isWindows = os.platform() === "win32",
        commandLine = executable;
      executable = isWindows
        ? "cmd"
        : "/bin/bash";
      args = [
        isWindows ? "/c" : "-c",
        commandLine
      ];
    }
    if (options) {
      // if the provided options have properties with the value
      // undefined, they will overwrite the defaults, which is
      // likely not what the consumer expects
      const o = options as Dictionary<string>;
      for (const k of Object.keys(o)) {
        if (o[k] === undefined) {
          delete o[k];
        }
      }
    }
    const opts = { ...defaultOptions, ...options } as SpawnOptions;
    const q = opts.disableAutomaticQuoting
      ? passThrough
      : quoteIfRequired;
    if (opts.interactive) {
      opts.stderr = undefined;
      opts.stdout = undefined;
    }
    debug("running gulp");
    if (!opts.stdio && defaultOptions.stdio /* this is just to make ts happy*/) {
      opts.stdio = [ ...defaultOptions.stdio ];
    }

    let
      stdOutWriter = nullConsumer,
      stdErrWriter = nullConsumer,
      stdoutFnSpecified = typeof opts.stdout === "function",
      stderrFnSpecified = typeof opts.stderr === "function";

    let
      suppressStdOut = !!opts.suppressOutput,
      suppressStdErr = !!opts.suppressOutput;

    if (opts.detached) {
      opts.stdio = "ignore";
      opts.stdout = undefined;
      opts.stderr = undefined;
    } else {
      if ((stdoutFnSpecified || stderrFnSpecified) &&
        !Array.isArray(opts.stdio) &&
        !!defaultOptions.stdio /* just to make ts happy */
      ) {
        opts.stdio = [ ...defaultOptions.stdio ];
      }

      if (stdoutFnSpecified) {
        stdOutWriter = opts.stdout as StringConsumer;
        (opts.stdio as string[])[1] = "pipe";
      } else if (Array.isArray(opts.stdio)) {
        opts.stdio[1] = "inherit";
      }
      if (stderrFnSpecified) {
        stdErrWriter = opts.stderr as StringConsumer;
        (opts.stdio as string[])[2] = "pipe";
      } else if (Array.isArray(opts.stdio)) {
        opts.stdio[2] = "inherit";
      }
    }

    disableLineBufferWhenUsingInternalLineBuffer(opts);

    const result = new SpawnResult(
      executable,
      args,
      -1,
      [],
      []
    )

    executable = q(executable);

    const quotedArgs = args.map(s => q(s)) as string[];
    debug(`spawning: ${ executable } ${ quotedArgs.join(" ") }`);
    debug({ opts });

    return new Promise((resolve, reject) => {
      try {
        const child = child_process.spawn(executable, quotedArgs, opts);
        if (!child) {
          return reject(new Error(`unable to spawn ${ executable } with args [${ args.join(",") }]`));
        }
        if (opts.detached) {
          return resolve(result);
        }
        debug(child);
        const stdout = [] as string[];
        const stderr = [] as string[];
        child.on("error", (err: string) => {
          debug(`child error: ${ err }`);
          destroyPipesOn(child);
          const e = new SpawnError(
            `"${ [ executable ].concat(args).join(" ") }" failed with "${ err }"`,
            executable,
            quotedArgs,
            -1,
            opts.suppressStdIoInErrors ? null : stderr,
            opts.suppressStdIoInErrors ? null : stdout
          );
          reject(e);
        });
        let exited = false;
        child.on("exit", generateExitHandler("exit"));
        child.on("close", generateExitHandler("close"));
        let cleared = false;
        const clearColorsOnce = () => {
          if (cleared) {
            return;
          }
          cleared = true;
          process.stdout.write(reset("\0"));
          process.stderr.write(reset("\0"));
        };
        const outWriter = (s: string) => {
          clearColorsOnce();
          stdOutWriter(s);
        };
        const errWriter = (s: string) => {
          clearColorsOnce();
          stdErrWriter(s);
        };
        setupIoHandler(outWriter, child.stdout, stdout, opts, suppressStdOut);
        setupIoHandler(errWriter, child.stderr, stderr, opts, suppressStdErr)

        function flushWriters() {
          tryFlush(stdOutWriter);
          tryFlush(stdErrWriter);
        }

        function tryFlush(writer: any) {
          const asAugmentedLog = writer as AugmentedLogFunction;
          if (!asAugmentedLog.flush) {
            return;
          }
          asAugmentedLog.flush();
        }

        function generateExitHandler(eventName: string): (code: number) => void {
          return (code: number) => {
            if (exited) {
              return;
            }
            destroyPipesOn(child);
            exited = true;
            flushWriters();
            debug(`child ${ eventName }s: ${ code }`);
            result.exitCode = code;
            result.stderr = stderr;
            result.stdout = stdout;
            if (code === 0) {
              resolve(result);
            } else {
              const err = new SpawnError(
                `"${ [ executable ]
                  .concat(args)
                  .join(" ") }" failed with exit code ${ code }`,
                executable,
                args,
                code,
                opts.suppressStdIoInErrors ? null : stdout,
                opts.suppressStdIoInErrors ? null : stderr
              );
              reject(err);
            }
          };
        }
      } catch (e) {
        reject(`Unable to spawn process: ${ e }\n${ (e as Error).stack }`);
      }
    });
  }

  function setupIoHandler(
    writer: IoConsumer,
    stream: Readable,
    collector: string[],
    opts: SpawnOptions,
    suppress: boolean
  ) {
    if (!stream) {
      return;
    }
    if (!writer) {
      writer = () => {
      };
    }

    function handle(data: string | Buffer) {
      if (data === undefined) {
        return;
      }
      if (data instanceof Buffer) {
        data = data.toString();
      }
      collector.push(data);
      if (suppress) {
        return;
      }
      writer(data)
    }

    if (opts.lineBuffer) {
      const rl = readline.createInterface({ input: stream });
      rl.on("line", handle);
    } else {
      stream.on("data", handle);
    }

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

  spawn.SpawnError = SpawnError;
  spawn.SpawnResult = SpawnResult;
  spawn.isSpawnError = function(o: any): o is SpawnError {
    return o instanceof SpawnError;
  }
  spawn.isSpawnResult = function(o: any): o is SpawnResult {
    return o instanceof SpawnResult;
  }

  function passThrough(s: string): string {
    return s;
  }

  function disableLineBufferWhenUsingInternalLineBuffer(
    opts: SpawnOptions
  ): void {
    const
      out = opts.stdout as AugmentedLogFunction,
      err = opts.stderr as AugmentedLogFunction;
    if (!out || !err) {
      return;
    }
    if (!!out.flush || !!err.flush) {
      opts.lineBuffer = false;
    }
  }

  module.exports = spawn;
})();
