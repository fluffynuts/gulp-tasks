"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    // MUST use for running batch files
    // you can use this for other commands but spawn is better
    // as it handles IO better
    const quoteIfRequired = require("./quote-if-required"), os = require("os"), spawn = require("./spawn"), debug = require("debug")("exec"), log = require("./log"), child_process = require("child_process"), defaultOptions = {
        cwd: process.cwd(),
        shell: true
    };
    function doExecFile(cmd, args, opts, handlers) {
        return new Promise((resolve, reject) => {
            try {
                child_process.execFile(cmd, args, opts, function (error, stdout, stderr) {
                    const stdErrString = (stderr || "").toString();
                    const stdOutString = (stdout || "").toString();
                    if ((handlers === null || handlers === void 0 ? void 0 : handlers.stdout) && stdOutString) {
                        handlers.stdout(stdOutString);
                    }
                    if (handlers === null || handlers === void 0 ? void 0 : handlers.stderr) {
                        handlers.stderr(stdErrString);
                    }
                    if (error) {
                        return reject({
                            error: error,
                            stderr: stderr,
                            stdout: stdout
                        });
                    }
                    resolve(stdout);
                });
            }
            catch (e) {
                console.error(`EXEC ERROR: ${e} / ${cmd} ${args}`);
                reject(e);
            }
        });
    }
    ;
    function trim(data) {
        return ("" + (data || "")).trim();
    }
    function isWarning(str) {
        return str.indexOf(" WARN ") > -1;
    }
    function isError(str) {
        return str.indexOf(" ERROR ") > -1;
    }
    function printLines(collector, data) {
        const lines = trim(data).split("\n");
        lines.forEach(function (line) {
            line = trim(line);
            collector.push(line);
            if (isError(line)) {
                log.error(line);
            }
            else if (isWarning(line)) {
                log.warning(line);
            }
            else {
                log.info(line);
            }
        });
    }
    function start(cmd, args, opts) {
        if (os.platform() == "win32") {
            const cmdArgs = ["/c", cmd];
            cmdArgs.push.apply(cmdArgs, args);
            log.suppressTimeStamps();
            return child_process.spawn("cmd.exe", cmdArgs, opts);
        }
        else {
            return child_process.spawn(cmd, args, opts);
        }
    }
    function doSpawn(cmd, args, opts, handlers) {
        handlers = handlers || {};
        const collectedStdOut = [];
        const collectedStdErr = [];
        const stdoutHandler = handlers.stdout || (printLines.bind(null, collectedStdOut));
        const stderrHandler = handlers.stderr || ((line) => {
            collectedStdErr.push(line);
            log.error(line);
        });
        return new Promise((resolve, reject) => {
            try {
                log.suppressTimeStamps();
                const proc = start(cmd, args, opts);
                if (proc.stdout) {
                    proc.stdout.on("data", (data) => {
                        stdoutHandler(data.toString());
                    });
                }
                if (proc.stderr) {
                    proc.stderr.on("data", (data) => {
                        stderrHandler(trim(data.toString()));
                    });
                }
                proc.on("close", function (exitCode) {
                    log.showTimeStamps();
                    if (exitCode) {
                        const e = new Error(`
Command exited with code ${exitCode}
More info:
command: ${cmd}
args: ${args.join(" ")}
stderr:
  ${collectedStdErr.join("\n  ")}
stdout:
  ${collectedStdOut.join("\n  ")}
`.trim());
                        reject(attachExecInfo(e, exitCode, cmd, args, opts, collectedStdOut, collectedStdErr));
                    }
                    else {
                        resolve(collectedStdOut.join("\n"));
                    }
                });
                proc.on("error", function (err) {
                    log.showTimeStamps();
                    log.error("failed to start process");
                    log.error(err);
                    reject(attachExecInfo(err, -1, cmd, args, opts));
                });
            }
            catch (e) {
                reject(attachExecInfo(e, -1, cmd, args, opts));
            }
        });
    }
    function attachExecInfo(e, exitCode, cmd, args, opts, collectedStdOut, collectedStdErr) {
        const err = e;
        err.info = {
            exitCode,
            cmd,
            args,
            opts,
            stdout: collectedStdOut || [],
            stderr: collectedStdErr || []
        };
        return err;
    }
    function doExec(cmd, args, opts, handlers) {
        return (opts._useExecFile)
            ? doExecFile(cmd, args, opts, handlers)
            : doSpawn(cmd, args, opts, handlers);
    }
    function exec(cmd, args, opts, handlers) {
        args = args || [];
        opts = Object.assign({}, defaultOptions, opts);
        opts.maxBuffer = Number.MAX_SAFE_INTEGER;
        cmd = quoteIfRequired(cmd);
        if (debug) {
            debug("executing:");
            debug(`- cmd: ${cmd}`);
            debug(`- args: ${JSON.stringify(args)}`);
            debug(`- opts: ${JSON.stringify(opts)}`);
            debug(`- handlers: ${JSON.stringify(handlers)}`);
        }
        return os.platform() === "win32"
            ? doExec(cmd, args, opts, handlers || {})
            : spawn(cmd, args, Object.assign({}, opts, handlers));
    }
    module.exports = exec;
})();
