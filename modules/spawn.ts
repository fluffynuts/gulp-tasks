import { IoConsumer } from "./exec";
import { Readable } from "stream";
import { ChildProcess } from "child_process";

(function() {
// use for spawning actual processes.
// You must use exec if you want to run batch files
  class SpawnError extends Error {
    get args(): string[] {
      return this._args;
    }

    get exe(): string {
      return this._exe;
    }

    get exitCode(): number {
      return this._exitCode;
    }

    get stdout(): string[] {
      return this._stdout ? [ ...this._stdout ] : [];
    }

    get stderr(): string[] {
      return this._stderr ? [ ...this._stderr ] : [];
    }

    private readonly _args: string[];
    private readonly _exe: string;
    private readonly _exitCode: number;
    private readonly _stdout: Nullable<string[]>;
    private readonly _stderr: Nullable<string[]>;

    constructor(
      message: string,
      exe: string,
      args: string[],
      exitCode: number,
      stdout: Nullable<string[]>,
      stderr: Nullable<string[]>
    ) {
      super(message);
      this._args = args;
      this._exe = exe;
      this._exitCode = exitCode;
      this._stderr = stderr ? [ ...stderr ] : null;
      this._stdout = stdout ? [ ...stdout ] : null;
    }

    public toString(): string {
      const lines = [
        `${ this.exe } ${ this.args.join(" ") }`,
        `Process exited with code: ${ this.exitCode }`,
      ];
      if (this._stderr === null && this._stdout === null) {
        // io has been suppressed;
        return lines.join("\n");
      }
      const hasStdOut = this.stdout && this.stdout.length > 0;
      const hasStdErr = this.stderr && this.stderr.length > 0;
      const hasOutput = hasStdErr || hasStdOut;
      if (!hasOutput) {
        lines.push("No output was captured on stderr or stdout.");
        return lines.join("\n");
      }
      if (hasStdErr) {
        this.addOutput(lines, "stderr:", this.stderr);
        if (hasStdOut) {
          lines.push("");
        }
      }
      if (hasStdOut) {
        this.addOutput(lines, "stdout:", this.stdout);
      }
      return lines.join("\n");
    }

    private addOutput(lines: string[], label: string, source: string[]) {
      lines.push(label);
      for (const line of source) {
        lines.push(` ${ line }`);
      }
    }
  }

  class SpawnResult {
    constructor(
      public exe: string,
      public args: string[],
      public exitCode: number,
      public stderr: string[],
      public stdout: string[]
    ) {
    }
  }

  const tryLoadDebug = function() {
      try {
        return require("debug")("spawn");
      } catch (e) {
        return function() {
        };
      }
    },
    quoteIfRequired = require("./quote-if-required"),
    debug = tryLoadDebug(),
    readline = require("readline"),
    child_process = require("child_process");

  function echoStdOut(data: string): void {
    console.log(data);
  }

  function echoStdErr(data: string): void {
    console.error(data);
  }

  const defaultOptions = {
    stdio: [ process.stdin, process.stdout, process.stdin ] as StdioOptions,
    cwd: process.cwd(),
    shell: true,
    lineBuffer: true,
    // if no functions are set up, then the child stderr & stdout
    // are null as they're not being piped to us at all
    stderr: echoStdErr as Optional<ProcessIO>,
    stdout: echoStdOut as Optional<ProcessIO>
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
    const args = !commandlineArgs ? [] : commandlineArgs;
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
    const opts = { ...defaultOptions, ...options };
    const q = opts.disableAutomaticQuoting
      ? passThrough
      : quoteIfRequired;
    if (opts.interactive) {
      opts.stderr = undefined;
      opts.stdout = undefined;
    }
    if (debug("gulp") > -1) {
      console.log("running gulp", opts);
    }

    if (!opts.stdio && defaultOptions.stdio /* this is just to make ts happy*/) {
      opts.stdio = [ ...defaultOptions.stdio ];
    }


    let
      stdOutWriter = nullConsumer,
      stdErrWriter = nullConsumer,
      stdoutFnSpecified = typeof opts.stdout === "function",
      stderrFnSpecified = typeof opts.stderr === "function";

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
        setupIoHandler(stdOutWriter, child.stdout, stdout, opts.lineBuffer);
        setupIoHandler(stdErrWriter, child.stderr, stderr, opts.lineBuffer)

        function generateExitHandler(eventName: string): (code: number) => void {
          return (code: number) => {
            if (exited) {
              return;
            }
            destroyPipesOn(child);
            exited = true;
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
    lineBuffer: Optional<boolean>
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
      writer(data)
    }

    if (lineBuffer) {
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

  module.exports = spawn;
})();
