import * as buffer from "buffer";
import { IoConsumer } from "./exec";
import { Readable } from "stream";

(function () {
// use for spawning actual processes.
// You must use exec if you want to run batch files

  const tryLoadDebug = function () {
      try {
        return require("debug")("spawn");
      } catch (e) {
        return function () {
        };
      }
    },
    quoteIfRequired = require("./quote-if-required"),
    debug = tryLoadDebug(),
    readline = require("readline"),
    child_process = require("child_process");

  const defaultOptions = {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: process.cwd(),
    shell: true,
    lineBuffer: true
  };

  // noinspection JSUnusedLocalSymbols
  function nullConsumer(str: string) {
    // intentionally left blank
  }

  function spawn(executable: string, args: string[], opts: SpawnOptions): Promise<SpawnResult> {
    args = args || [];
    opts = Object.assign({}, defaultOptions, opts);

    if (!opts.stdio) {
      opts.stdio = [...defaultOptions.stdio];
    }

    let
      stdOutWriter = nullConsumer,
      stdErrWriter = nullConsumer,
      stdoutFnSpecified = typeof opts.stdout === "function",
      stderrFnSpecified = typeof opts.stderr === "function";

    if (stdoutFnSpecified || stderrFnSpecified && !Array.isArray(opts.stdio)) {
      opts.stdio = [...defaultOptions.stdio];
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


    const result = {
      executable: executable,
      args: args,
      exitCode: -1,
      stderr: [],
      stdout: []
    } as SpawnResult;

    executable = quoteIfRequired(executable);

    debug(`spawning: ${ executable } ${ args.map(a => "\"" + a + "\"").join(" ") }`);
    debug({ opts });

    return new Promise((resolve, reject) => {
      try {
        const child = child_process.spawn(executable, args, opts);
        if (!child) {
          throw new Error(`unable to spawn ${ executable } with args [${ args.join(",") }]`);
        }
        debug(child);
        const stdout = [] as string[];
        const stderr = [] as string[];
        child.on("error", (err: string) => {
          debug(`child error: ${ err }`);
          const e = new Error(
            `"${ [executable].concat(args).join(" ") }" failed with "${ err }"`
          ) as SpawnError;
          e.exitCode = -1;
          e.stderr = stderr;
          e.stdout = stdout;
          reject(e);
        });
        child.on("close", (code: number) => {
          debug(`child exits: ${ code }`);
          result.exitCode = code;
          result.stderr = stderr;
          result.stdout = stdout;
          if (code === 0) {
            resolve(result);
          } else {
            const err = new Error(
              `"${ [executable]
                .concat(args)
                .join(" ") }" failed with exit code ${ code }`
            ) as SpawnError;
            err.exitCode = code;
            err.stdout = stdout;
            err.stderr = stderr;
            return reject(err);
          }
        });
        setupIoHandler(stdOutWriter, child.stdout, stdout, opts.lineBuffer);
        setupIoHandler(stdErrWriter, child.stderr, stderr, opts.lineBuffer)
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
    if (!writer || !stream) {
      return;
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

  module.exports = spawn;
})();
