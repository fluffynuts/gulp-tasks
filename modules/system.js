"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const os = require("os"), isWindows = os.platform() === "win32", which = requireModule("which"), createTempFile = requireModule("create-temp-file"), quoteIfRequired = requireModule("quote-if-required"), SystemError = requireModule("system-error"), LineBuffer = requireModule("line-buffer"), child_process = require("child_process"), SystemResult = requireModule("system-result");
    function fillOut(opts) {
        const result = (opts || {});
        result.collectors = {
            stdout: [],
            stderr: []
        };
        return result;
    }
    async function system(program, args, options) {
        debugger;
        let alreadyExited = false;
        const opts = fillOut(options);
        if (opts.suppressOutput === undefined) {
            opts.suppressOutput = !!opts.stderr || !!opts.stdout;
        }
        let exe = program, programArgs = args || [];
        if (!which(program) && !args) {
            // assume it's a long commandline
            const search = isWindows
                ? "cmd.exe"
                : "sh";
            exe = which(search);
            if (!exe) {
                throw new SystemError(`Unable to find system shell '${search}' in path`, program, args || [], -1, [], []);
            }
            const tempFileContents = [program].concat(programArgs.map(quoteIfRequired)).join(" ");
            const pre = isWindows
                ? "@echo off"
                : "";
            const tempFile = await createTempFile(`
${pre}
${tempFileContents}
        `.trim());
            programArgs = isWindows
                ? ["/c"]
                : [];
            programArgs.push(tempFile.path);
        }
        const result = new SystemResult(`${exe}`, programArgs, undefined, [], []);
        return new Promise((resolve, reject) => {
            const child = child_process.spawn(exe, programArgs, {
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
            });
            child.on("error", handleError);
            child.on("exit", handleExit.bind(null, "exit"));
            child.on("close", handleExit.bind(null, "close"));
            const stdoutFn = typeof opts.stdout === "function" ? opts.stdout : noop;
            const stderrFn = typeof opts.stderr === "function" ? opts.stderr : noop;
            const stdoutLineBuffer = new LineBuffer(s => {
                result.stdout.push(s);
                stdoutFn(s);
                if (opts.suppressOutput) {
                    return;
                }
                console.log(s);
            }), stderrLineBuffer = new LineBuffer(s => {
                result.stderr.push(s);
                stderrFn(s);
                if (opts.suppressOutput) {
                    return;
                }
                console.error(s);
            });
            child.stdout.on("data", handleStdIo(stdoutLineBuffer));
            child.stderr.on("data", handleStdIo(stderrLineBuffer));
            function handleError(e) {
                if (hasExited()) {
                    return;
                }
                return reject(generateError(`Error spawning process: ${e}`));
            }
            function handleExit(ctx, code) {
                if (hasExited()) {
                    return;
                }
                if (code) {
                    const errResult = generateError(`Process exited (${ctx}) with non-zero code: ${code}`, code);
                    return reject(errResult);
                }
                result.exitCode = code;
                return resolve(result);
            }
            function generateError(message, exitCode) {
                return new SystemError(message, program, args, exitCode !== null && exitCode !== void 0 ? exitCode : -1, result.stdout, result.stderr);
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
    function handleStdIo(lineBuffer) {
        return (d) => {
            lineBuffer.append(d);
        };
    }
    function noop(_) {
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
    system.isError = SystemError.isError;
    system.isResult = SystemResult.isResult;
    module.exports = system;
})();
