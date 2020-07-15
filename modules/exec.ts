export type IoConsumer = (d: string) => void

export interface IoHandlers {
  stdout?: IoConsumer;
  stderr?: IoConsumer;
}

export interface ExecError extends Error {
  info: {
    exitCode: number;
    cmd: string;
    args: string[];
    opts?: ExecOpts;
    stdout: string[];
    stderr: string[];
  }
}

(function () {
// MUST use for running batch files
// you can use this for other commands but spawn is better
// as it handles IO better
  const
    quoteIfRequired = require("./quote-if-required"),
    os = require("os"),
    spawn = require("./spawn"),
    debug = require("debug")("exec"),
    log = require("./log"),
    child_process = require("child_process");

  function makeDefaultOptions() {
    return {
      cwd: process.cwd(),
      shell: true
    };
  }

  function doExecFile(
    cmd: string,
    args: string[],
    opts: ExecOpts,
    handlers?: IoHandlers): Promise<string> {

    return new Promise((resolve, reject) => {
      try {
        child_process.execFile(cmd, args, opts, function (error: Error, stdout: Buffer, stderr: Buffer) {
          const stdErrString = (stderr || "").toString();
          const stdOutString = (stdout || "").toString();
          if (handlers?.stdout && stdOutString) {
            handlers.stdout(stdOutString);
          }
          if (handlers?.stderr) {
            handlers.stderr(stdErrString);
          }
          if (error) {
            return reject({
              error: error,
              stderr: stderr,
              stdout: stdout
            });
          }
          resolve(stdout.toString());
        });
      } catch (e) {
        console.error(`EXEC ERROR: ${ e } / ${ cmd } ${ args }`);
        reject(e);
      }
    });
  }

  function trim(data: string) {
    return ("" + (data || "")).trim();
  }

  function isWarning(str: string) {
    return str.indexOf(" WARN ") > -1;
  }

  function isError(str: string) {
    return str.indexOf(" ERROR ") > -1;
  }

  function printLines(collector: string[], suppress: boolean, data: string) {
    const lines = trim(data).split("\n");
    lines.forEach(function (line) {
      line = trim(line);
      collector.push(line);
      if (suppress) {
        return;
      }
      if (isError(line)) {
        log.error(line);
      } else if (isWarning(line)) {
        log.warning(line);
      } else {
        log.info(line);
      }
    });
  }

  function start(
    cmd: string,
    args: string[],
    opts: ExecOpts
  ) {
    if (os.platform() == "win32") {
      const cmdArgs = ["/c", cmd];
      cmdArgs.push.apply(cmdArgs, args);
      log.suppressTimeStamps();
      return child_process.spawn("cmd.exe", cmdArgs, opts);
    } else {
      return child_process.spawn(cmd, args, opts);
    }
  }

  function doWindowsStart(
    cmd: string,
    args: string[],
    opts: ExecOpts,
    handlers?: IoHandlers): Promise<string> {
    handlers = handlers || {};
    const collectedStdOut: string[] = [];
    const collectedStdErr: string[] = [];
    opts.suppressOutput = opts.suppressOutput ?? false;
    const stdoutHandler = handlers.stdout || (printLines.bind(null, collectedStdOut, opts.suppressOutput)) as IoConsumer;
    const stderrHandler = handlers.stderr || ((line: string) => {
      collectedStdErr.push(line);
      if (!opts.suppressOutput) {
        log.error(line);
      }
    });
    return new Promise((resolve, reject) => {
      try {
        log.suppressTimeStamps();
        const proc = start(cmd, args, opts);
        if (proc.stdout) {
          proc.stdout.on("data", (data: Buffer & string) => {
            stdoutHandler(data.toString());
          });
        }
        if (proc.stderr) {
          proc.stderr.on("data", (data: Buffer & string) => {
            stderrHandler(trim(data.toString()));
          });
        }
        proc.on("close", function (exitCode: number) {
          log.showTimeStamps();
          if (exitCode) {
            const e = new Error(`
Command exited with code ${ exitCode }
More info:
command: ${ cmd }
args: ${ args.join(" ") }
stderr:
  ${ collectedStdErr.join("\n  ") }
stdout:
  ${ collectedStdOut.join("\n  ") }
`.trim()
            ) as ExecError;
            reject(
              attachExecInfo(
                e, exitCode, cmd, args, opts, collectedStdOut, collectedStdErr
              )
            );
          } else {
            resolve(collectedStdOut.join("\n"));
          }
        });
        proc.on("error", function (err: Error) {
          log.showTimeStamps();
          log.error("failed to start process");
          log.error(err);
          reject(attachExecInfo(err, -1, cmd, args, opts));
        });
      } catch (e) {
        reject(attachExecInfo(e, -1, cmd, args, opts));
      }
    });
  }

  function attachExecInfo(
    e: Error,
    exitCode: number,
    cmd: string,
    args: string[],
    opts?: ExecOpts,
    collectedStdOut?: string[],
    collectedStdErr?: string[]
  ): ExecError {
    const err = e as ExecError;
    err.info = {
      exitCode,
      cmd,
      args,
      opts,
      stdout: collectedStdOut || [],
      stderr: collectedStdErr || []
    }
    return err;
  }

  function doExec(
    cmd: string,
    args: string[],
    opts: ExecOpts,
    handlers?: IoHandlers): Promise<string> {
    return (opts?._useExecFile)
      ? doExecFile(cmd, args, opts, handlers)
      : doWindowsStart(cmd, args, opts, handlers);
  }

  function noop() {
    // intentionally blank
  }

  function makeSafe(consumer: IoConsumer) {
    return (data: string) => {
      try {
        consumer(data);
      } catch (e) {
        // suppress
      }
    };
  }

  async function doSpawn(
    cmd: string,
    args: string[],
    opts: ExecOpts,
    handlers?: IoHandlers): Promise<string> {
    const
      stderr: string[] = [],
      stdout: string[] = [],
      merged: string[] = [],
      callerStdErr = handlers?.stderr ?? noop,
      callerStdOut = handlers?.stdout ?? noop,
      safeCallerStdErr = makeSafe(callerStdErr),
      safeCallerStdOut = makeSafe(callerStdOut),
      stdErrPrinter = opts?.suppressOutput ? noop : console.error.bind(console),
      stdOutPrinter = opts?.suppressOutput ? noop : console.log.bind(console);
    const myHandlers: IoHandlers = {
      stderr: data => {
        stderr.push(data);
        merged.push(data);
        stdErrPrinter(data);
        safeCallerStdErr(data);
      },
      stdout: data => {
        stdout.push(data)
        merged.push(data);
        stdOutPrinter(data);
        safeCallerStdOut(data);
      }
    }
    const spawnOptions = {
      ...opts,
      ...myHandlers
    };
    try {
      await spawn(
        cmd,
        args,
        spawnOptions
      )
      return opts?.mergeIo
        ? merged.join("\n")
        : stdout.join("\n");
    } catch (errorResult) {
      if (errorResult.error) {
        throw errorResult.error;
      }
      throw errorResult;
    }
  }

  function exec(
    cmd: string,
    args?: string[],
    opts?: ExecOpts,
    handlers?: IoHandlers
  ): Promise<string> {
    args = args || [];
    opts = Object.assign({}, makeDefaultOptions(), opts);
    opts.maxBuffer = Number.MAX_SAFE_INTEGER;
    cmd = quoteIfRequired(cmd);
    if ((exec as any).alwaysSuppressOutput) {
      opts.suppressOutput = true;
    }
    if (debug) {
      debug("executing:")
      debug(`- cmd: ${ cmd }`);
      debug(`- args: ${ JSON.stringify(args) }`);
      debug(`- opts: ${ JSON.stringify(opts) }`);
      debug(`- handlers: ${ JSON.stringify(handlers) }`);
    }
    return os.platform() === "win32"
      ? doExec(cmd, args, opts, handlers || {})
      : doSpawn(cmd, args, Object.assign({}, opts), handlers);
  }

  module.exports = exec;
})();
