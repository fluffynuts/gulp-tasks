"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yafs_1 = require("yafs");
(function () {
    // MUST use for running batch files
    // you can use this for other commands but spawn is better
    // as it handles IO better
    const path = require("path"), quoteIfRequired = require("./quote-if-required"), failAfter = requireModule("fail-after"), os = require("os"), spawn = requireModule("spawn"), system = requireModule("system"), debug = require("debug")("exec"), log = require("./log"), which = require("which"), ZarroError = requireModule("zarro-error"), child_process = require("child_process");
    function makeDefaultOptions() {
        return {
            cwd: process.cwd(),
            shell: true,
            suppressOutput: true
        };
    }
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
                    resolve(stdout.toString());
                });
            }
            catch (e) {
                console.error(`EXEC ERROR: ${e} / ${cmd} ${args}`);
                reject(e);
            }
        });
    }
    function trim(data) {
        return ("" + (data || "")).trim();
    }
    function isWarning(str) {
        return str.indexOf(" WARN ") > -1;
    }
    function isError(str) {
        return str.indexOf(" ERROR ") > -1;
    }
    function printLines(collector, suppress, data) {
        const lines = trim(data).split("\n");
        lines.forEach(function (line) {
            line = trim(line);
            collector.push(line);
            if (suppress) {
                return;
            }
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
    function doWindowsStart(cmd, args, opts, handlers) {
        var _a;
        handlers = handlers || {};
        const collectedStdOut = [];
        const collectedStdErr = [];
        opts.suppressOutput = (_a = opts.suppressOutput) !== null && _a !== void 0 ? _a : false;
        const stdoutHandler = handlers.stdout || (printLines.bind(null, collectedStdOut, opts.suppressOutput));
        const stderrHandler = handlers.stderr || ((line) => {
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
                        reject(attachExecInfo(e, exitCode, cmd, args, false, opts, collectedStdOut, collectedStdErr));
                    }
                    else {
                        resolve(collectedStdOut.join("\n"));
                    }
                });
                proc.on("error", function (err) {
                    log.showTimeStamps();
                    log.error("failed to start process");
                    log.error(err);
                    reject(attachExecInfo(err, -1, cmd, args, false, opts));
                });
            }
            catch (e) {
                reject(attachExecInfo(e, -1, cmd, args, false, opts));
            }
        });
    }
    function attachExecInfo(e, exitCode, cmd, args, timedOut, opts, collectedStdOut, collectedStdErr) {
        const err = e;
        err.info = {
            exitCode,
            cmd,
            args,
            opts,
            stdout: collectedStdOut || [],
            stderr: collectedStdErr || [],
            timedOut
        };
        return err;
    }
    function doExec(cmd, args, opts, handlers) {
        debugger;
        return (opts === null || opts === void 0 ? void 0 : opts._useExecFile)
            ? doExecFile(cmd, args, opts, handlers)
            : doWindowsStart(cmd, args, opts, handlers);
    }
    function noop() {
        // intentionally blank
    }
    function makeSafe(consumer) {
        return (data) => {
            try {
                consumer(data);
            }
            catch (e) {
                // suppress
            }
        };
    }
    async function doSystemWin32(cmd, args, opts, handlers) {
        if (await isBatchFile(cmd)) {
            return doSystem("cmd", ["/c", cmd].concat(args), opts, handlers);
        }
        return doSystem(cmd, args, opts, handlers);
    }
    async function isBatchFile(cmd) {
        const resolved = await fullPathTo(cmd), ext = path.extname(resolved).toLowerCase();
        return win32BatchExtensions.has(ext);
    }
    const win32BatchExtensions = new Set([
        ".bat",
        ".cmd"
    ]);
    async function fullPathTo(cmd) {
        if (await (0, yafs_1.folderExists)(cmd)) {
            throw new ZarroError(`'${cmd}' is a folder, not a file (required to execute)`);
        }
        if (await (0, yafs_1.fileExists)(cmd)) {
            return cmd;
        }
        try {
            return await which(cmd);
        }
        catch (e) {
            throw new ZarroError(`'${cmd}' not found directly or in the PATH`);
        }
    }
    async function doSystem(cmd, args, opts, handlers) {
        var _a, _b;
        const result = [];
        const stderr = [];
        const stdout = [];
        const stderrHandler = (_a = handlers === null || handlers === void 0 ? void 0 : handlers.stderr) !== null && _a !== void 0 ? _a : noop;
        const stdoutHandler = (_b = handlers === null || handlers === void 0 ? void 0 : handlers.stdout) !== null && _b !== void 0 ? _b : noop;
        try {
            await system(cmd, args, {
                suppressOutput: opts.suppressOutput,
                stdout: (s) => {
                    result.push(s);
                    stdout.push(s);
                    tryDo(() => stdoutHandler(s));
                },
                stderr: (s) => {
                    result.push(s);
                    stderr.push(s);
                    tryDo(() => stderrHandler(s));
                }
            });
            return result.join("\n");
        }
        catch (e) {
            const err = e;
            // TODO: determine this from the result / error somehow
            const timedOut = false;
            attachExecInfo(err, err.exitCode, cmd, args, timedOut, opts, stdout, stderr);
            throw err;
        }
    }
    function tryDo(action) {
        try {
            action();
        }
        catch (e) {
            // suppress
        }
    }
    async function doSpawn(cmd, args, opts, handlers) {
        var _a, _b;
        const stderr = [], stdout = [], merged = [], callerStdErr = (_a = handlers === null || handlers === void 0 ? void 0 : handlers.stderr) !== null && _a !== void 0 ? _a : noop, callerStdOut = (_b = handlers === null || handlers === void 0 ? void 0 : handlers.stdout) !== null && _b !== void 0 ? _b : noop, safeCallerStdErr = makeSafe(callerStdErr), safeCallerStdOut = makeSafe(callerStdOut), stdErrPrinter = (opts === null || opts === void 0 ? void 0 : opts.suppressOutput) ? noop : console.error.bind(console), stdOutPrinter = (opts === null || opts === void 0 ? void 0 : opts.suppressOutput) ? noop : console.log.bind(console);
        const myHandlers = {
            stderr: data => {
                const dataStr = data.toString();
                stderr.push(dataStr);
                merged.push(dataStr);
                stdErrPrinter(dataStr);
                safeCallerStdErr(dataStr);
            },
            stdout: data => {
                const dataStr = data.toString();
                stdout.push(dataStr);
                merged.push(dataStr);
                stdOutPrinter(dataStr);
                safeCallerStdOut(dataStr);
            }
        };
        const spawnOptions = Object.assign(Object.assign({}, opts), myHandlers);
        try {
            await spawn(cmd, args, spawnOptions);
            debugger;
            return (opts === null || opts === void 0 ? void 0 : opts.mergeIo)
                ? merged.join("\n")
                : stdout.join("\n");
        }
        catch (ex) {
            const e = ex;
            attachExecInfo(e, e.exitCode, cmd, args, false, opts);
            if (e.stderr) {
                e.info.stderr = e.stderr;
            }
            if (e.stdout) {
                e.info.stdout = e.stdout;
            }
            throw e;
        }
    }
    async function exec(cmd, args, opts, handlers) {
        args = args || [];
        opts = Object.assign({}, makeDefaultOptions(), opts);
        opts.maxBuffer = Number.MAX_SAFE_INTEGER;
        cmd = quoteIfRequired(cmd);
        if (exec.alwaysSuppressOutput) {
            opts.suppressOutput = true;
        }
        if (debug) {
            debug("executing:");
            debug(`- cmd: ${cmd}`);
            debug(`- args: ${JSON.stringify(args)}`);
            debug(`- opts: ${JSON.stringify(opts)}`);
            debug(`- handlers: ${JSON.stringify(handlers)}`);
        }
        let timeout = 0;
        if ((opts === null || opts === void 0 ? void 0 : opts.timeout) && opts.timeout > 0) {
            // extend the provided timeout -- node will stop the child process
            //  and we need to race a failing promise there first
            timeout = opts.timeout;
            opts.timeout += 50;
        }
        // noinspection ES6MissingAwait
        const promise = os.platform() === "win32"
            ? doSystemWin32(cmd, args, Object.assign({}, opts), handlers || {})
            : doSystem(cmd, args, Object.assign({}, opts), handlers || {});
        if (!timeout) {
            return promise;
        }
        try {
            const fail = failAfter(timeout);
            const result = await Promise.race([
                promise,
                fail.promise
            ]);
            fail.cancel();
            return result;
        }
        catch (e) {
            const execError = e;
            if (execError.info) {
                // info was attached elsewhere
                throw execError;
            }
            const err = new Error("timed out");
            attachExecInfo(err, 1, cmd, args, true, opts);
            throw err;
        }
    }
    module.exports = exec;
})();
