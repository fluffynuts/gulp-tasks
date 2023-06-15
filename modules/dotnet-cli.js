"use strict";
(function () {
    // TODO: perhaps one day, this should become an npm module of its own
    const spawn = requireModule("spawn");
    const q = requireModule("quote-if-required");
    let defaultNugetSource;
    async function determineDefaultNugetSource() {
        if (defaultNugetSource) {
            return defaultNugetSource;
        }
        const args = [
            "nuget",
            "list",
            "source"
        ];
        const lines = [];
        await spawn("dotnet", args, {
            stdout: line => {
                lines.push(line);
            }
        });
        const enabledSources = lines
            .join("\n") // can't guarantee we got lines individually
            .split("\n")
            .map(l => l.trim())
            .filter(l => l.indexOf("[Enabled]") > -1)
            // lines should come through like "  1.  nuget.org [Enabled]"
            .map(l => l.replace(/^\s*\d+\.\s*/, "").replace("[Enabled]", "").trim())
            .sort((a, b) => {
            // try to sort such that nuget.org is at the top, if in the list
            if (a.toLowerCase().indexOf("nuget.org") > -1) {
                return -1;
            }
            if (b.toLowerCase().indexOf("nuget.org") > -1) {
                return 1;
            }
            return 0;
        });
        const result = enabledSources[0];
        if (!result) {
            throw new Error(`Unable to determine default nuget source. Please specify 'source' on your options.`);
        }
        return result;
    }
    async function nugetPush(opts) {
        validate(opts);
        if (!opts.apiKey) {
            throw new Error("apiKey was not specified");
        }
        const args = [
            "nuget",
            "push",
            opts.target,
            "--api-key",
            opts.apiKey
        ];
        if (!opts.source) {
            // dotnet core _demands_ that the source be set.
            opts.source = await determineDefaultNugetSource();
        }
        pushIfSet(args, opts.source, "--source");
        pushIfSet(args, opts.symbolApiKey, "--symbol-api-key");
        pushIfSet(args, opts.symbolSource, "--symbol-source");
        pushIfSet(args, opts.timeout, "--timeout");
        pushFlag(args, opts.disableBuffering, "--disable-buffering");
        pushFlag(args, opts.noSymbols, "--no-symbols");
        pushFlag(args, opts.skipDuplicate, "--skip-duplicate");
        pushFlag(args, opts.noServiceEndpoint, "--no-service-endpoint");
        pushFlag(args, opts.forceEnglishOutput, "--force-english-output");
        return runDotNetWith(args, opts);
    }
    async function build(opts) {
        validate(opts);
        const args = [
            "build",
            q(opts.target)
        ];
        pushCommonBuildArgs(args, opts);
        pushFlag(args, opts.disableBuildServers, "--disable-build-servers");
        pushFlag(args, opts.noIncremental, "--no-incremental");
        pushFlag(args, opts.noDependencies, "--no-dependencies");
        pushFlag(args, opts.noRestore, "--no-restore");
        pushFlag(args, opts.selfContained, "--self-contained");
        pushVersionSuffix(args, opts);
        pushMsbuildProperties(args, opts);
        pushAdditionalArgs(args, opts);
        return runDotNetWith(args, opts);
    }
    async function test(opts) {
        const args = [
            "test",
            q(opts.target)
        ];
        pushCommonBuildArgs(args, opts);
        pushIfSet(args, opts.settingsFile, "--settings");
        pushIfSet(args, opts.filter, "--filter");
        pushIfSet(args, opts.diagnostics, "--diag");
        pushNoBuild(args, opts);
        pushNoRestore(args, opts);
        pushLoggers(args, opts.loggers);
        pushMsbuildProperties(args, opts);
        pushEnvVars(args, opts.env);
        pushAdditionalArgs(args, opts);
        return runDotNetWith(args, opts);
    }
    async function pack(opts) {
        validate(opts);
        const copy = Object.assign(Object.assign({}, opts), { msbuildProperties: Object.assign({}, opts.msbuildProperties) });
        const args = [
            "pack",
            q(copy.target)
        ];
        pushVerbosity(args, copy);
        pushOutput(args, copy);
        pushConfiguration(args, copy);
        pushNoBuild(args, copy);
        pushFlag(args, copy.includeSymbols, "--include-symbols");
        pushFlag(args, copy.includeSource, "--include-source");
        pushNoRestore(args, copy);
        pushVersionSuffix(args, copy);
        if (copy.nuspec) {
            copy.msbuildProperties = copy.msbuildProperties || {};
            copy.msbuildProperties["NuspecFile"] = copy.nuspec;
        }
        pushMsbuildProperties(args, copy);
        return runDotNetWith(args, copy);
    }
    function pushCommonBuildArgs(args, opts) {
        pushVerbosity(args, opts);
        pushConfiguration(args, opts);
        pushIfSet(args, opts.framework, "--framework");
        pushIfSet(args, opts.runtime, "--runtime");
        pushIfSet(args, opts.arch, "--arch");
        pushIfSet(args, opts.os, "--os");
        pushOutput(args, opts);
    }
    function pushVersionSuffix(args, opts) {
        pushIfSet(args, opts.versionSuffix, "--version-suffix");
    }
    function pushNoRestore(args, opts) {
        pushFlag(args, opts.noRestore, "--no-restore");
    }
    function pushNoBuild(args, opts) {
        pushFlag(args, opts.noBuild, "--no-build");
    }
    function validate(opts) {
        if (!opts) {
            throw new Error("no options provided");
        }
        if (!opts.target) {
            throw new Error("target not set");
        }
    }
    function pushOutput(args, opts) {
        pushIfSet(args, opts.output, "--output");
    }
    function pushVerbosity(args, opts) {
        pushIfSet(args, opts.verbosity, "--verbosity");
    }
    function pushConfiguration(args, opts) {
        pushIfSet(args, opts.configuration, "--configuration");
    }
    function pushAdditionalArgs(args, opts) {
        if (opts.additionalArguments) {
            args.push.apply(args, opts.additionalArguments);
        }
    }
    async function runDotNetWith(args, opts) {
        try {
            return await spawn("dotnet", args, {
                stdout: opts.stdout,
                stderr: opts.stderr
            });
        }
        catch (e) {
            if (opts.suppressErrors) {
                return e;
            }
            throw e;
        }
    }
    function pushMsbuildProperties(args, opts) {
        if (!opts.msbuildProperties) {
            return;
        }
        for (const key of Object.keys(opts.msbuildProperties)) {
            args.push(`-p:${q(key)}=${q(opts.msbuildProperties[key])}`);
        }
    }
    function pushEnvVars(args, env) {
        if (!env) {
            return;
        }
        for (const key of Object.keys(env)) {
            args.push("-e");
            args.push(`${q(key)}=${q(env[key])}`);
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
            args.push(cliSwitch, q(`${value}`));
        }
    }
    function pushFlag(args, value, cliSwitch) {
        if (value) {
            args.push(cliSwitch);
        }
    }
    module.exports = {
        test,
        build,
        pack,
        nugetPush
    };
})();
