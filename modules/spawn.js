"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    // use for spawning actual processes.
    // You must use exec if you want to run batch files
    const tryLoadDebug = function () {
        try {
            return require("debug")("spawn");
        }
        catch (e) {
            return function () {
            };
        }
    }, quoteIfRequired = require("./quote-if-required"), debug = tryLoadDebug(), readline = require("readline"), child_process = require("child_process");
    const defaultOptions = {
        stdio: [process.stdin, process.stdout, process.stderr],
        cwd: process.cwd(),
        shell: true,
        lineBuffer: true
    };
    // noinspection JSUnusedLocalSymbols
    function nullConsumer(str) {
        // intentionally left blank
    }
    function spawn(executable, args, opts) {
        args = args || [];
        opts = Object.assign({}, defaultOptions, opts);
        if (!opts.stdio) {
            opts.stdio = [...defaultOptions.stdio];
        }
        let stdOutWriter = nullConsumer, stdErrWriter = nullConsumer, stdoutFnSpecified = typeof opts.stdout === "function", stderrFnSpecified = typeof opts.stderr === "function";
        if (stdoutFnSpecified || stderrFnSpecified && !Array.isArray(opts.stdio)) {
            opts.stdio = [...defaultOptions.stdio];
        }
        if (stdoutFnSpecified) {
            stdOutWriter = opts.stdout;
            opts.stdio[1] = "pipe";
        }
        else if (Array.isArray(opts.stdio)) {
            opts.stdio[1] = "inherit";
        }
        if (stderrFnSpecified) {
            stdErrWriter = opts.stderr;
            opts.stdio[2] = "pipe";
        }
        else if (Array.isArray(opts.stdio)) {
            opts.stdio[2] = "inherit";
        }
        const result = {
            executable: executable,
            args: args,
            exitCode: -1,
            stderr: [],
            stdout: []
        };
        executable = quoteIfRequired(executable);
        const quotedArgs = args.map(quoteIfRequired);
        debug(`spawning: ${executable} ${quotedArgs.join(" ")}`);
        debug({ opts });
        return new Promise((resolve, reject) => {
            try {
                const child = child_process.spawn(executable, quotedArgs, opts);
                if (!child) {
                    reject(new Error(`unable to spawn ${executable} with args [${args.join(",")}]`));
                }
                debug(child);
                const stdout = [];
                const stderr = [];
                child.on("error", (err) => {
                    debug(`child error: ${err}`);
                    destroyPipesOn(child);
                    const e = new Error(`"${[executable].concat(args).join(" ")}" failed with "${err}"`);
                    e.exitCode = -1;
                    e.stderr = stderr;
                    e.stdout = stdout;
                    reject(e);
                });
                let exited = false;
                child.on("exit", generateExitHandler("exit"));
                child.on("close", generateExitHandler("close"));
                setupIoHandler(stdOutWriter, child.stdout, stdout, opts.lineBuffer);
                setupIoHandler(stdErrWriter, child.stderr, stderr, opts.lineBuffer);
                function generateExitHandler(eventName) {
                    return (code) => {
                        if (exited) {
                            return;
                        }
                        destroyPipesOn(child);
                        exited = true;
                        debug(`child ${eventName}s: ${code}`);
                        result.exitCode = code;
                        result.stderr = stderr;
                        result.stdout = stdout;
                        if (code === 0) {
                            resolve(result);
                        }
                        else {
                            const err = new Error(`"${[executable]
                                .concat(args)
                                .join(" ")}" failed with exit code ${code}`);
                            err.exitCode = code;
                            err.stdout = stdout;
                            err.stderr = stderr;
                            reject(err);
                        }
                    };
                }
            }
            catch (e) {
                reject(`Unable to spawn process: ${e}\n${e.stack}`);
            }
        });
    }
    function setupIoHandler(writer, stream, collector, lineBuffer) {
        if (!writer || !stream) {
            return;
        }
        function handle(data) {
            if (data === undefined) {
                return;
            }
            if (data instanceof Buffer) {
                data = data.toString();
            }
            collector.push(data);
            writer(data);
        }
        if (lineBuffer) {
            const rl = readline.createInterface({ input: stream });
            rl.on("line", handle);
        }
        else {
            stream.on("data", handle);
        }
    }
    function destroyPipesOn(child) {
        for (const pipe of [child.stdout, child.stderr, child.stdin]) {
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
                }
                catch (e) {
                    // suppress: if the pipe is already dead, that's fine.
                }
            }
        }
    }
    module.exports = spawn;
})();
