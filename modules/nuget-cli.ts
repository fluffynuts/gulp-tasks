(function () {
  const
    resolveNuget = requireModule<ResolveNuget>("resolve-nuget"),
    log = requireModule<Log>("log"),
    { mkdir } = require("yafs"),
    system = requireModule<System>("system"),
    {
      pushFlag,
      pushIfSet
    } = requireModule<CliSupport>("cli-support");

  const defaultInstallOptions = {
    nonInteractive: true
  } as Partial<NugetInstallOptions>;

  async function install(
    options: NugetInstallOptions
  ): Promise<void> {
    if (!options) {
      throw new Error(`options are required`);
    }
    if (!`${ options.packageId }`.trim()) {
      throw new Error(`no nuget packageId provided`);
    }
    const opts = {
      ...defaultInstallOptions,
      ...options
    } as NugetInstallOptions;
    if (opts.outputDirectory) {
      await mkdir(opts.outputDirectory);
    }
    const args = [
      "install",
      opts.packageId
    ] as string[];

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

    const systemOpts = { ...opts.systemOptions };
    systemOpts.suppressOutput = systemOpts.suppressOutput === undefined
      ? !!opts.nonInteractive
      : systemOpts.suppressOutput;

    await runNugetWith(
      `Installing ${ prettyPackageName(opts) }`,
      args,
      systemOpts
    );
  }

  function prettyPackageName(opts: NugetInstallOptions) {
    return opts.version === undefined
      ? opts.packageId
      : `${ opts.packageId }-${ opts.version }`;
  }

  async function runNugetWith(
    label: string,
    args: string[],
    opts: SystemOptions
  ): Promise<void> {
    log.info(label)
    const nuget = resolveNuget()
    await system(
      nuget,
      args,
      opts
    );
  }

  module.exports = {
    install
  };
})();
