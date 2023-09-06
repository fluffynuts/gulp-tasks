"use strict";
(function () {
    const resolveNuget = requireModule("resolve-nuget"), log = requireModule("log"), { mkdir } = require("yafs"), system = requireModule("system"), { pushFlag, pushIfSet } = requireModule("cli-support");
    const defaultInstallOptions = {
        nonInteractive: true
    };
    async function install(options) {
        if (!options) {
            throw new Error(`options are required`);
        }
        if (!`${options.packageId}`.trim()) {
            throw new Error(`no nuget packageId provided`);
        }
        const opts = Object.assign(Object.assign({}, defaultInstallOptions), options);
        if (opts.outputDirectory) {
            await mkdir(opts.outputDirectory);
        }
        const args = [
            "install",
            opts.packageId
        ];
        pushFlag(args, opts.nonInteractive, "-NonInteractive");
        pushIfSet(args, opts.version, "-Version");
        pushIfSet(args, opts.outputDirectory, "-OutputDirectory");
        pushIfSet(args, opts.dependencyVersion, "-DependencyVersion");
        pushIfSet(args, opts.framework, "-Framework");
        pushIfSet(args, opts.excludeVersion, "-ExcludeVersion");
        pushIfSet(args, opts.solutionDirectory, "-SolutionDirectory");
        pushIfSet(args, opts.source, "-Source");
        pushIfSet(args, opts.fallbackSource, "-FallbackSource");
        pushIfSet(args, opts.packageSaveMode, "-PackageSaveMode");
        pushIfSet(args, opts.verbosity, "-Verbosity");
        pushIfSet(args, opts.configFile, "-ConfigFile");
        pushFlag(args, opts.directDownload, "-DirectDownload");
        pushFlag(args, opts.noCache, "-NoCache");
        pushFlag(args, opts.disableParallelProcessing, "-DisableParallelProcessing");
        pushFlag(args, opts.preRelease, "-Prerelease");
        pushFlag(args, opts.requireConsent, "-RequireConsent");
        pushFlag(args, opts.forceEnglishOutput, "-ForceEnglishOutput");
        const systemOpts = Object.assign({}, opts.systemOptions);
        systemOpts.suppressOutput = systemOpts.suppressOutput === undefined
            ? !!opts.nonInteractive
            : systemOpts.suppressOutput;
        await runNugetWith(`Installing ${prettyPackageName(opts)}`, args, systemOpts);
    }
    function prettyPackageName(opts) {
        return opts.version === undefined
            ? opts.packageId
            : `${opts.packageId}-${opts.version}`;
    }
    async function runNugetWith(label, args, opts) {
        log.info(label);
        const nuget = resolveNuget();
        await system(nuget, args, opts);
    }
    module.exports = {
        install
    };
})();
