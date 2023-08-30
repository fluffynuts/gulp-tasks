(function() {
    // this is a convenient wrapper around system()
    const
        { fileExists, folderExists } = require("yafs"),
        path = require("path"),
        quoteIfRequired = requireModule<QuoteIfRequired>("quote-if-required"),
        failAfter = requireModule<FailAfter>("fail-after"),
        os = require("os"),
        system = requireModule<System>("system"),
        debug = requireModule<DebugFactory>("debug")(__filename),
        which = requireModule<Which>("which"),
        ZarroError = requireModule<ZarroError>("zarro-error");

    function makeDefaultOptions() {
        return {
            cwd: process.cwd(),
            shell: true,
            suppressOutput: true
        };
    }

    function attachExecInfo(
        e: Error,
        exitCode: number,
        cmd: string,
        args: string[],
        timedOut: boolean,
        opts?: ExecOpts,
        collectedStdOut?: string[],
        collectedStdErr?: string[],
    ): ExecError {
        const err = e as ExecError;
        err.info = {
            exitCode,
            cmd,
            args,
            opts,
            stdout: collectedStdOut || [],
            stderr: collectedStdErr || [],
            timedOut
        }
        return err;
    }

    function noop() {
        // intentionally blank
    }

    async function doSystemWin32(
        cmd: string,
        args: string[],
        opts: ExecOpts,
        handlers?: IoHandlers
    ): Promise<string> {
        if (await isBatchFile(cmd)) {
            return doSystem(
                "cmd",
                [ "/c", cmd ].concat(args),
                opts,
                handlers
            )
        }
        return doSystem(cmd, args, opts, handlers);
    }

    async function isBatchFile(cmd: string): Promise<boolean> {
        const
            resolved = await fullPathTo(cmd),
            ext = path.extname(resolved).toLowerCase();
        return win32BatchExtensions.has(ext);
    }

    const win32BatchExtensions = new Set<string>([
                                                     ".bat",
                                                     ".cmd"
                                                 ]);

    async function fullPathTo(cmd: string): Promise<string> {
        if (await folderExists(cmd)) {
            throw new ZarroError(`'${ cmd }' is a folder, not a file (required to execute)`);
        }
        if (await fileExists(cmd)) {
            return cmd;
        }
        const inPath = which(cmd);
        if (inPath) {
            return inPath;
        }
        throw new ZarroError(`'${ cmd }' not found directly or in the PATH`);
    }

    async function doSystem(
        cmd: string,
        args: string[],
        opts: ExecOpts,
        handlers?: IoHandlers
    ): Promise<string> {
        const result = [] as string[];
        const stderr = [] as string[];
        const stdout = [] as string[];
        const stderrHandler = handlers?.stderr ?? noop;
        const stdoutHandler = handlers?.stdout ?? noop;
        try {
            await system(
                cmd,
                args, {
                    suppressOutput: opts.suppressOutput,
                    stdout: (s: string) => {
                        result.push(s);
                        stdout.push(s);
                        tryDo(() => stdoutHandler(s));
                    },
                    stderr: (s: string) => {
                        result.push(s);
                        stderr.push(s);
                        tryDo(() => stderrHandler(s));
                    }
                }
            );
            return result.join("\n");
        } catch (e) {
            const err = e as SystemError;
            // TODO: determine this from the result / error somehow
            const timedOut = false;
            attachExecInfo(
                err,
                err.exitCode,
                cmd,
                args,
                timedOut,
                opts,
                stdout,
                stderr
            )
            throw err;
        }
    }

    function tryDo(action: (() => void)): void {
        try {
            action();
        } catch (e) {
            // suppress
        }
    }

    async function exec(
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

        let timeout = 0;
        if (opts?.timeout && opts.timeout > 0) {
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
                                              ]) as string;
            fail.cancel();
            return result;
        } catch (e) {
            const execError = e as ExecError;
            if (execError.info) {
                // info was attached elsewhere
                throw execError
            }
            const err = new Error("timed out");
            attachExecInfo(err, 1, cmd, args, true, opts);
            throw err;
        }
    }

    module.exports = exec;
})();
