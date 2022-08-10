"use strict";
(function () {
    const spawn = requireModule("spawn");
    async function test(opts) {
        const args = [
            "test",
            opts.target
        ];
        pushIfSet(args, opts.verbosity, "-v");
        pushIfSet(args, opts.configuration, "-c");
        pushFlag(args, opts.noBuild, "--no-build");
        pushFlag(args, opts.noRestore, "--no-restore");
        pushLoggers(args, opts.loggers);
        try {
            return await spawn("dotnet", args, {
                stdout: opts.stdout,
                stderr: opts.stderr
            });
        }
        catch (e) {
            return e;
        }
    }
    function pushLoggers(args, loggers) {
        if (!loggers) {
            return;
        }
        for (const loggerName of Object.keys(loggers)) {
            const build = [loggerName];
            const options = loggers[loggerName];
            for (const key of Object.keys(options)) {
                const value = options[key];
                build.push([key, value].join("="));
            }
            args.push("--logger", build.join(";"));
        }
    }
    function pushIfSet(args, value, cliSwitch) {
        if (value) {
            args.push(cliSwitch, value);
        }
    }
    function pushFlag(args, value, cliSwitch) {
        if (value) {
            args.push(cliSwitch);
        }
    }
    module.exports = {
        test
    };
})();
