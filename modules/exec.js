"use strict";
(function () {
    // this is a convenient wrapper around system()
    const { fileExists, folderExists } = require("yafs"), path = require("path"), quoteIfRequired = requireModule("quote-if-required"), failAfter = requireModule("fail-after"), os = require("os"), system = requireModule("system"), debug = requireModule("debug")(__filename), which = requireModule("which"), ZarroError = requireModule("zarro-error");
    function makeDefaultOptions() {
        return {
            cwd: process.cwd(),
            shell: true,
            suppressOutput: true
        };
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
    function noop() {
        // intentionally blank
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
        if (await folderExists(cmd)) {
            throw new ZarroError(`'${cmd}' is a folder, not a file (required to execute)`);
        }
        if (await fileExists(cmd)) {
            return cmd;
        }
        const inPath = which(cmd);
        if (inPath) {
            return inPath;
        }
        throw new ZarroError(`'${cmd}' not found directly or in the PATH`);
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
