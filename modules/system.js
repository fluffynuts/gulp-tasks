"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const os = require("os"), debug = requireModule("debug")(__filename), isWindows = os.platform() === "win32", which = requireModule("which"), createTempFile = requireModule("create-temp-file"), quoteIfRequired = requireModule("quote-if-required"), SystemError = requireModule("system-error"), LineBuffer = requireModule("line-buffer"), child_process = require("child_process"), SystemResult = requireModule("system-result");
    function fillOut(opts) {
        const result = (opts || {});
        result.collectors = {
            stdout: [],
            stderr: []
        };
        return result;
    }
    function trimQuotes(cmd) {
        if (!cmd) {
            return cmd;
        }
        if (cmd[0] === '"' && cmd[cmd.length - 1] === '"') {
            return cmd.substring(1, cmd.length - 1);
        }
        return cmd;
    }
    async function system(program, args, options) {
        let alreadyExited = false;
        const opts = fillOut(options);
        if (opts.suppressOutput === undefined) {
            opts.suppressOutput = !!opts.stderr || !!opts.stdout;
        }
        let exe = trimQuotes(program), programArgs = args || [];
        const noArgs = !args || args.length === 0;
        if (!which(program) && noArgs) {
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
        const spawnOptions = {
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
        };
        debug("launching", {
            exe,
            programArgs,
            spawnOptions
        });
        const result = new SystemResult(`${exe}`, programArgs, undefined, [], []);
        return new Promise((resolve, reject) => {
            const child = child_process.spawn(exe, programArgs, spawnOptions);
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
            child.on("error", handleError);
            child.on("exit", handleExit.bind(null, "exit"));
            child.on("close", handleExit.bind(null, "close"));
            function handleError(e) {
                if (hasExited()) {
                    return;
                }
                debug("child errors", e);
                return reject(generateError(`Error spawning process: ${e}\n${exe} ${programArgs.map(q)}`));
            }
            function handleExit(ctx, code) {
                if (hasExited()) {
                    return;
                }
                debug(`child exited with code: ${code}`);
                const moreInfo = generateMoreInfo(result);
                if (code) {
                    const errResult = generateError(`Process exited (${ctx}) with non-zero code: ${code}\n${moreInfo}`.trim(), code);
                    return reject(errResult);
                }
                result.exitCode = code;
                return resolve(result);
            }
            function generateMoreInfo(result) {
                if (!result) {
                    return "(no more info available)";
                }
                const lines = [
                    "attempted to run:",
                    generateCommandLineFor(result)
                ];
                if (result.stderr && result.stderr.length) {
                    lines.push("stderr:");
                    lines.push(...result.stderr.map(s => `  ${s}`));
                }
                if (result.stdout && result.stdout.length) {
                    lines.push("stdout:");
                    lines.push(...result.stdout.map(s => `  ${s}`));
                }
                return lines.join("\n");
            }
            function generateCommandLineFor(info) {
                return [info.exe, (info.args || []).map(q)].join(" ");
            }
            function generateError(message, exitCode) {
                if (system.isError(result)) {
                    const errorDetails = gatherErrorDetails(result);
                    if (errorDetails) {
                        message = `${message}\n${errorDetails}`;
                    }
                }
                return new SystemError(message, program, args, exitCode !== null && exitCode !== void 0 ? exitCode : -1, result.stdout, result.stderr);
            }
            const q = requireModule("quote-if-required");
            function gatherErrorDetails(err) {
                const parts = [];
                if (err) {
                    parts.push(`(cmd: ${err.exe} ${err.args.map(q).join(" ")})`);
                }
                if (err && err.stderr && err.stderr.length > 0) {
                    parts.push(err.stderr[err.stderr.length - 1]);
                }
                if (err && err.stdout && err.stdout.length > 0) {
                    parts.push(err.stdout[err.stdout.length - 1]);
                }
                return parts.join("\n");
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
