(function () {
  const
    resolveNuget = requireModule<ResolveNuget>("resolve-nuget"),
    findLocalNuget = requireModule<FindLocalNuget>("find-local-nuget"),
    parseNugetSources = requireModule<ParseNugetSources>("parse-nuget-sources"),
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

  async function clearAllCache(): Promise<void> {
    await runNugetWith(
      "Clearing all nuget caches",
      [ "locals", "-clear" ], {
        suppressOutput: true
      }
    );
  }

  async function clearHttpCache(): Promise<void> {
    await runNugetWith(
      "Clearing all nuget caches",
      [ "locals", "http-cache", "-clear" ], {
        suppressOutput: true
      }
    );
  }

  function prettyPackageName(opts: NugetInstallOptions) {
    return opts.version === undefined
      ? opts.packageId
      : `${ opts.packageId }-${ opts.version }`;
  }

  async function listSources(): Promise<NugetSource[]> {
    const sysResult = await runNugetWith("", [ "sources", "list" ], { suppressOutput: true });
    if (system.isError(sysResult)) {
      throw sysResult;
    }
    return parseNugetSources(sysResult.stdout);
  }

  async function addSource(
    src: NugetAddSourceOptions
  ): Promise<void> {
    if (!src) {
      throw new Error(`new nuget source options not specified`);
    }
    if (!src.name) {
      throw new Error(`name not specified`);
    }
    if (!src.url) {
      throw new Error(`url not specified`);
    }

    const
      existing = await listSources(),
      haveByName = existing.find(o => o.name === src.name),
      isEnabled = haveByName && haveByName.enabled,
      sameUrl = haveByName && haveByName.url == src.url;

    debugger;
    if (haveByName && sameUrl) {
      log.info(`Nuget source '${ src.name }' already registered`);
      if (!isEnabled) {
        await enableSource(src.name);
      }
      return;
    }

    const args = [
      "source", "add"
    ];
    pushIfSet(args, src.name, "-Name");
    pushIfSet(args, src.url, "-Source");
    pushIfSet(args, src.username, "-Username");
    pushIfSet(args, src.password, "-Password");
    pushFlag(args, src.storePasswordInClearText, "-StorePasswordInClearText");
    args.push("-NonInteractive");
    pushIfSet(args, src.validAuthenticationTypes, "-ValidAuthenticationTypes");
    pushIfSet(args, src.configFile, "-ConfigFile");
    args.push("-ForceEnglishOutput");
    await runNugetWith(`Adding nuget source: [${ src.name }]: ${ src.url }`, args, { suppressOutput: true });
  }

  async function enableSource(name: string): Promise<void> {
    const existing = await findSourceByName(name);
    if (!existing) {
      const all = await listSources();
      throw new Error(`cannot enable nuget source: ${ name } (source is unknown)\n${ JSON.stringify(all, null, 2) }`);
    }
    if (existing.enabled) {
      // already enabled; nothing to do
      return;
    }
    const args = [ "source", "enable", "-Name", name ];
    await runNugetWith(`Enable nuget source: ${ name }`, args, { suppressOutput: true });
  }

  async function disableSource(name: string): Promise<void> {
    const existing = await findSourceByName(name);
    if (!existing) {
      const all = await listSources();
      throw new Error(`cannot disable nuget source: ${ name } (source is unknown)\n${ JSON.stringify(all, null, 2) }`);
    }
    if (!existing.enabled) {
      // already disabled; nothing to do
      return;
    }
    const args = [ "source", "disable", "-Name", name ];
    await runNugetWith(`Disable nuget source: ${ name }`, args, { suppressOutput: true });
  }

  async function findSourceByName(name: string): Promise<Optional<NugetSource>> {
    if (!name) {
      throw new Error(`source name not set`);
    }
    const lowerCaseName = name.toLowerCase();
    return await findSource(
      o => `${ o.name }`.toLowerCase() === lowerCaseName
    );
  }


  async function findSource(match: ((o: NugetSource) => boolean)): Promise<Optional<NugetSource>> {
    const allSources = await listSources();
    return allSources.find(match);
  }

  async function runNugetWith(
    label: string,
    args: string[],
    opts: SystemOptions
  ): Promise<SystemResult | SystemError> {
    if (label) {
      log.info(label)
    }
    const nuget = resolveNuget(undefined, false) ||
                  await findLocalNuget(true);
    return await system(
      nuget,
      args,
      opts
    );
  }

  module.exports = {
    install,
    clearAllCache,
    clearHttpCache,
    listSources,
    addSource,
    enableSource,
    disableSource
  };
})();
