import {writeTextFile} from "yafs";

(function () {
  // TODO: perhaps one day, this should become an npm module of its own
  type PerConfigurationFunction = (configuration: string) => Promise<SystemResult | SystemError>;
  const system = requireModule<System>("system");
  const {isError} = system;
  const ZarroError = requireModule<ZarroError>("zarro-error");
  const path = require("path");
  const {
    fileExists,
    readTextFile
  } = require("yafs");
  const {yellow} = requireModule<AnsiColors>("ansi-colors");
  const q = requireModule<QuoteIfRequired>("quote-if-required");
  const parseXml = requireModule<ParseXml>("parse-xml");
  const {
    readAssemblyVersion,
    readCsProjProperty,
    readAssemblyName
  } = requireModule<CsProjUtils>("csproj-utils");
  const updateNuspecVersion = requireModule<UpdateNuspecVersion>("update-nuspec-version");
  const readNuspecVersion = requireModule<ReadNuspecVersion>("read-nuspec-version");
  const log = requireModule<Log>("log");
  const env = requireModule<Env>("env");

  let defaultNugetSource: string;

  function showHeader(label: string) {
    console.log(yellow(label));
  }

  async function listPackages(csproj: string): Promise<DotNetPackageReference[]> {
    if (!(await fileExists(csproj))) {
      return [];
    }
    const contents = await readTextFile(csproj);
    const xml = await parseXml(contents) as XmlNode;
    const pkgRefs = findPackageReferencesOn(xml);
    const result = [] as DotNetPackageReference[];
    for (const ref of pkgRefs) {
      result.push({
        id: ref.$.Include,
        version: ref.$.Version
      });
    }
    return result;
  }

  function getByPath(obj: any, path: string): any {
    if (obj === undefined || obj === null) {
      return undefined;
    }
    const parts = path.split(".");
    if (parts.length === 0) {
      return undefined;
    }
    let result = obj;
    do {
      const el = parts.shift();
      if (el === undefined) {
        break;
      }
      result = result[el];
    } while (result !== undefined);

    return result;
  }

  function findPackageReferencesOn(xml: XmlNode): XmlNode[] {
    const itemGroups = getByPath(xml, "Project.ItemGroup") as Dictionary<XmlNode[]>[];
    const result = [] as XmlNode[];
    for (const dict of itemGroups) {
      const packageReferences = getByPath(dict, "PackageReference") as XmlNode[];
      if (packageReferences) {
        result.push.apply(result, packageReferences);
      }
    }
    return result;
  }

  interface XmlNode
    extends Dictionary<XmlNode[] | Dictionary<string>> {
    $: Dictionary<string>
  }

  const requiredContainerPackage = "Microsoft.NET.Build.Containers";

  async function publish(
    opts: DotNetPublishOptions
  ): Promise<SystemResult | SystemError> {
    if (opts.publishContainer) {
      const packageRefs = await listPackages(opts.target);
      const match = packageRefs.find(
        // nuget package refs are actually case-insensitive, though
        // the constant is of the "proper" casing
        o => o.id.toLowerCase() == requiredContainerPackage.toLowerCase()
      );
      if (!match) {
        throw new ZarroError(
          `container publish logic requires a nuget package reference for '${requiredContainerPackage}' on project '${opts.target}'`
        )
      }
    }
    return runOnAllConfigurations(
      `Publishing`,
      opts,
      configuration => {
        const args = [
          "publish",
          q(opts.target)
        ];
        pushFlag(args, opts.useCurrentRuntime, "--use-current-runtime");
        pushOutput(args, opts);
        pushIfSet(args, opts.manifest, "--manifest");
        pushNoBuild(args, opts);
        pushNoRestore(args, opts);
        pushConfiguration(args, configuration);
        pushFramework(args, opts);
        pushIfSet(args, opts.versionSuffix, "--version-suffix");
        pushRuntime(args, opts);
        pushOperatingSystem(args, opts);
        pushSelfContainedForPublish(args, opts);
        pushArch(args, opts);
        pushDisableBuildServers(args, opts);

        pushContainerOpts(args, opts);

        pushVerbosity(args, opts);
        return runDotNetWith(args, opts);
      }
    )
  }

  function pushContainerOpts(
    args: string[],
    opts: DotNetPublishContainerOptions
  ) {
    if (!opts.publishContainer) {
      return;
    }
    args.push("-t:PublishContainer");
    pushContainerImageTag(args, opts);
    pushContainerRegistry(args, opts);
    pushContainerImageName(args, opts);
  }

  function pushContainerImageName(
    args: string[],
    opts: DotNetPublishContainerOptions
  ) {
    pushMsbuildPropertyIfSet(
      args,
      opts.containerImageName,
      "ContainerImageName"
    )
  }

  function pushContainerImageTag(
    args: string[],
    opts: DotNetPublishContainerOptions
  ) {
    pushMsbuildPropertyIfSet(
      args,
      opts.containerImageTag,
      "ContainerImageTag"
    );
  }

  function pushContainerRegistry(
    args: string[],
    opts: DotNetPublishContainerOptions
  ) {
    pushMsbuildPropertyIfSet(
      args,
      opts.containerRegistry,
      "ContainerRegistry"
    );
  }

  function pushMsbuildPropertyIfSet(
    args: string[],
    value: Optional<string>,
    name: string
  ) {
    if (!value) {
      return;
    }
    pushMsbuildProperty(args, name, value);
  }

  async function clean(
    opts: DotNetCleanOptions
  ): Promise<SystemResult | SystemError> {
    return runOnAllConfigurations(
      `Cleaning`,
      opts,
      configuration => {
        const args = [
          "clean",
          q(opts.target)
        ];
        pushFramework(args, opts);
        pushRuntime(args, opts);
        pushConfiguration(args, configuration);
        pushVerbosity(args, opts);
        pushOutput(args, opts);
        pushAdditionalArgs(args, opts);
        return runDotNetWith(args, opts);
      }
    )
  }

  async function build(
    opts: DotNetBuildOptions
  ): Promise<SystemResult | SystemError> {
    return runOnAllConfigurations(
      "Building",
      opts,
      configuration => {
        const args = [
          "build",
          q(opts.target)
        ];
        pushCommonBuildArgs(args, opts, configuration);
        pushFlag(args, opts.noIncremental, "--no-incremental");
        pushFlag(args, opts.noDependencies, "--no-dependencies");
        pushFlag(args, opts.noRestore, "--no-restore");
        pushFlag(args, opts.selfContained, "--self-contained");
        pushVersionSuffix(args, opts);
        pushMsbuildProperties(args, opts);
        pushDisableBuildServers(args, opts);
        pushAdditionalArgs(args, opts);

        return runDotNetWith(args, opts);
      }
    );
  }

  async function test(
    opts: DotNetTestOptions
  ): Promise<SystemResult | SystemError> {
    return runOnAllConfigurations(
      "Testing",
      opts,
      configuration => {
        const args = [
          "test",
          q(opts.target)
        ];
        pushCommonBuildArgs(args, opts, configuration);

        pushIfSet(args, opts.settingsFile, "--settings");
        pushIfSet(args, opts.filter, "--filter")
        pushIfSet(args, opts.diagnostics, "--diag");
        pushNoBuild(args, opts);
        pushNoRestore(args, opts);

        pushLoggers(args, opts.loggers);
        pushMsbuildProperties(args, opts);
        pushEnvVars(args, opts.env);
        pushAdditionalArgs(args, opts);

        // there's a lot of stdio/stderr from tests, and it
        // should be shown already - including it in the
        // error dump is not only unnecessary, it confuses
        // the test handler wrt quackers output handling
        opts.suppressStdIoInErrors = true;
        return runDotNetWith(args, opts);
      }
    );
  }

  async function pack(
    opts: DotNetPackOptions
  ): Promise<SystemResult | SystemError> {
    return runOnAllConfigurations(
      "Packing",
      opts,
      async configuration => {
        const copy = {
          ...opts,
          msbuildProperties: {...opts.msbuildProperties}
        }
        const args = [
          "pack",
          q(copy.target)
        ];
        pushConfiguration(args, configuration);
        pushVerbosity(args, copy);
        pushOutput(args, copy);
        pushNoBuild(args, copy);

        pushFlag(args, copy.includeSymbols, "--include-symbols");
        pushFlag(args, copy.includeSource, "--include-source");
        pushNoRestore(args, copy);
        let revert = undefined as Optional<RevertVersion>;

        try {
          const nuspecPath = copy.nuspec;
          if (nuspecPath && await shouldIncludeNuspec(copy, copy.target)) {
            copy.msbuildProperties = copy.msbuildProperties || {};
            copy.msbuildProperties["NuspecFile"] = nuspecPath;

            if (opts.versionSuffix !== undefined) {
              revert = {
                path: nuspecPath,
                version: await readNuspecVersion(nuspecPath)
              }

              log.warn(`
WARNING: 'dotnet pack' ignores --version-suffix when a nuspec file is provided.
          The version in '${copy.nuspec}' will be temporarily set to ${opts.versionSuffix} whilst
          packing and reverted later.
`.trim());

              await updateNuspecVersion(nuspecPath, opts.versionSuffix);
              // TODO: hook into "after dotnet run" to revert
            }
          }
          if (!revert) {
            pushVersionSuffix(args, copy);
          }
          pushMsbuildProperties(args, copy)
          pushAdditionalArgs(args, copy);
          return await runDotNetWith(args, copy);
        } catch (e) {
          throw e;
        } finally {
          debugger;
          if (revert && revert.version !== undefined) {
            await updateNuspecVersion(revert.path, revert.version);
          }
        }
      }
    );
  }

  interface RevertVersion {
    path: string;
    version: Optional<string>;
  }

  async function shouldIncludeNuspec(
    opts: DotNetPackOptions,
    target: string
  ): Promise<boolean> {
    debugger;
    if (!opts.nuspec) {
      return false;
    }

    if (await fileExists(opts.nuspec)) {
      return true;
    }

    const
      container = path.dirname(target),
      resolved = path.resolve(path.join(container, opts.nuspec));
    if (await fileExists(resolved)) {
      return true;
    }

    if (opts.ignoreMissingNuspec) {
      return false;
    }
    throw new ZarroError(
      `nuspec file not found at '${opts.nuspec}' (from cwd: '${process.cwd()}`
    );
  }

  async function nugetPush(
    opts: DotNetNugetPushOptions
  ): Promise<SystemResult | SystemError> {
    validate(opts);
    if (!opts.apiKey) {
      throw new Error("apiKey was not specified");
    }
    const args = [
      "nuget",
      "push",
      opts.target
    ];
    if (opts.apiKey) {
      args.push("--api-key", opts.apiKey);
    }
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
    pushAdditionalArgs(args, opts);
    return runDotNetWith(args, opts);
  }

  function pushSelfContainedForPublish(
    args: string[],
    opts: DotNetPublishOptions
  ) {
    if (opts.runtime === undefined) {
      return;
    }
    if (opts.selfContained === undefined) {
      args.push("--self-contained");
      return;
    }
    args.push(
      opts.selfContained
        ? "--self-contained"
        : "--no-self-contained"
    );
  }

  function pushDisableBuildServers(args: string[], opts: DotNetPublishOptions) {
    pushFlag(args, opts.disableBuildServers, "--disable-build-servers");
  }

  async function runOnAllConfigurations(
    label: string,
    opts: DotNetCommonBuildOptions,
    toRun: PerConfigurationFunction
  ): Promise<SystemResult | SystemError> {
    validate(opts);
    let configurations = resolveConfigurations(opts);
    if (configurations.length < 1) {
      configurations = [...defaultConfigurations]
    }
    let lastResult: Optional<SystemResult>;
    for (const configuration of configurations) {
      showHeader(`${label} ${q(opts.target)} with configuration ${configuration}${detailedInfoFor(opts)}`)
      const thisResult = await toRun(configuration);
      if (isError(thisResult)) {
        return thisResult;
      }
      lastResult = thisResult;
    }
    // for simplicity: return the last system result (at least for now, until there's a reason to get clever)
    if (lastResult === undefined) {
      // this is really here for TS
      throw new Error(`No build configurations could be determined, which is odd, because there's even a fallback.`);
    }
    return lastResult;
  }

  function detailedInfoFor(opts: DotNetCommonBuildOptions): string {
    const parts = [
      opts.os,
      opts.arch,
      opts.framework,
      opts.runtime
    ].filter(o => !!o);
    if (parts.length === 0) {
      return "";
    }
    return ` (${parts.join(" ")})`;
  }

  async function determineDefaultNugetSource() {
    if (defaultNugetSource) {
      return defaultNugetSource;
    }
    const args = [
      "nuget",
      "list",
      "source"
    ];
    const systemResult = await system("dotnet", args, {
      suppressOutput: true
    });
    const enabledSources = systemResult.stdout
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

  // this is actually a viable configuration... but we're going to use
  // it as a flag to not put in -c at all
  const defaultConfigurations = ["default"];

  function resolveConfigurations(opts: { configuration?: string | string[] }): string[] {
    if (!opts.configuration) {
      return defaultConfigurations;
    }
    return Array.isArray(opts.configuration)
      ? opts.configuration
      : [opts.configuration];
  }

  function pushFramework(args: string[], opts: DotNetTestOptions) {
    pushIfSet(args, opts.framework, "--framework");
  }

  function pushRuntime(args: string[], opts: DotNetTestOptions) {
    pushIfSet(args, opts.runtime, "--runtime");
  }

  function pushArch(args: string[], opts: DotNetTestOptions) {
    pushIfSet(args, opts.arch, "--arch");
  }

  function pushConfiguration(
    args: string[],
    configuration: string
  ) {
    if (!configuration) {
      return;
    }
    if (configuration.toLowerCase() === "default") {
      return;
    }
    args.push.call(args, "--configuration", configuration);
  }

  function pushCommonBuildArgs(
    args: string[],
    opts: DotNetTestOptions,
    configuration: string
  ) {
    pushVerbosity(args, opts);
    pushConfiguration(args, configuration);
    pushFramework(args, opts);
    pushRuntime(args, opts);
    pushArch(args, opts);
    pushOperatingSystem(args, opts);
    pushOutput(args, opts);
  }

  function pushOperatingSystem(args: string[], opts: DotNetTestOptions) {
    pushIfSet(args, opts.os, "--os");
  }

  function pushVersionSuffix(
    args: string[],
    opts: { versionSuffix?: string }
  ) {
    pushIfSet(args, opts.versionSuffix, "--version-suffix");
  }


  function pushNoRestore(
    args: string[],
    opts: { noRestore?: boolean }
  ) {
    pushFlag(args, opts.noRestore, "--no-restore");
  }

  function pushNoBuild(
    args: string[],
    opts: { noBuild?: boolean }
  ) {
    pushFlag(args, opts.noBuild, "--no-build");
  }

  function validate(
    opts: DotNetCommonBuildOptions
  ) {
    if (!opts) {
      throw new Error("no options provided");
    }
    if (!opts.target) {
      throw new Error("target not set");
    }
  }

  function pushOutput(
    args: string[],
    opts: { output?: string }
  ) {
    pushIfSet(args, opts.output, "--output");
  }

  function pushVerbosity(
    args: string[],
    opts: { verbosity?: string }
  ) {
    pushIfSet(args, opts.verbosity, "--verbosity");
  }

  function pushAdditionalArgs(
    args: string[],
    opts: DotNetTestOptions
  ) {
    if (opts.additionalArguments) {
      args.push.apply(args, opts.additionalArguments);
    }
  }

  async function runDotNetWith(
    args: string[],
    opts: DotNetBaseOptions
  ): Promise<SystemResult | SystemError> {
    try {
      return await system("dotnet", args, {
        stdout: opts.stdout,
        stderr: opts.stderr,
        suppressOutput: opts.suppressOutput,
        suppressStdIoInErrors: opts.suppressStdIoInErrors
      });
    } catch (e) {
      if (opts.suppressErrors) {
        return e as SystemError;
      }
      throw e;
    }
  }

  function pushMsbuildProperties(
    args: string[],
    opts: DotNetBaseOptions | Dictionary<string>
  ) {
    if (!opts.msbuildProperties) {
      return;
    }
    if (hasMsbuildProperties(opts)) {
      for (const key of Object.keys(opts.msbuildProperties)) {
        pushMsbuildProperty(args, key, opts.msbuildProperties[key]);
      }
    } else {
      for (const key of Object.keys(opts)) {
        pushMsbuildProperty(args, key, opts[key]);
      }
    }
  }

  function pushMsbuildProperty(
    args: string[],
    key: string,
    value: string
  ) {
    args.push(
      `-p:${q(key)}=${q(value)}`
    )
  }

  function hasMsbuildProperties(opts: any): opts is DotNetBaseOptions {
    return opts !== undefined && opts.msbuildProperties !== undefined;
  }

  function pushEnvVars(args: string[], env?: Dictionary<string>) {
    if (!env) {
      return;
    }
    for (const key of Object.keys(env)) {
      args.push("-e");
      args.push(
        `${q(key)}=${q(env[key])}`
      )
    }
  }

  function pushLoggers(args: string[], loggers: Optional<DotNetTestLoggers>) {
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
      args.push("--logger", `${build.join(";")}`);
    }
  }

  function pushIfSet(
    args: string[],
    value: Optional<string | number>,
    cliSwitch: string
  ) {
    if (value) {
      args.push(cliSwitch, q(`${value}`));
    }
  }

  function pushFlag(args: string[], value: Optional<boolean>, cliSwitch: string) {
    if (value) {
      args.push(cliSwitch);
    }
  }

  async function resolveContainerOptions(
    opts: DotNetPublishOptions
  ): Promise<ResolvedContainerOption[]> {
    const result = [] as ResolvedContainerOption[];
    await pushResolvedContainerOption(
      result,
      opts,
      "containerImageTag",
      env.DOTNET_PUBLISH_CONTAINER_IMAGE_TAG,
      () => findFallbackContainerImageTag(opts.target)
    );

    await pushResolvedContainerOption(
      result,
      opts,
      "containerRegistry",
      env.DOTNET_PUBLISH_CONTAINER_REGISTRY,
      async () => (await readCsProjProperty(
        opts.target,
        "ContainerRegistry",
        "localhost"
      )) as string
    );

    await pushResolvedContainerOption(
      result,
      opts,
      "containerImageName",
      env.DOTNET_PUBLISH_CONTAINER_IMAGE_NAME,
      () => findFallbackContainerImageName(opts.target)
    );

    return result;
  }

  async function findFallbackContainerImageTag(
    csproj: string
  ) {
    const specified = await readCsProjProperty(
      csproj,
      "ContainerImageTag"
    );
    if (specified) {
      return specified;
    }
    return readAssemblyVersion(csproj);
  }

  async function findFallbackContainerImageName(
    csproj: string
  ) {
    const specified = await readCsProjProperty(
      csproj,
      "ContainerImageName"
    );
    if (specified) {
      return specified;
    }

    return readAssemblyName(csproj);
  }

  async function pushResolvedContainerOption(
    collected: ResolvedContainerOption[],
    opts: DotNetPublishOptions,
    option: keyof DotNetPublishContainerOptions,
    environmentVariable: string,
    fallback: (() => Promise<string>)
  ): Promise<void> {
    let
      value = opts[option] as string,
      usingFallback = false;
    if (!value) {
      value = await fallback();
      usingFallback = true
    }
    collected.push({
      option,
      value,
      environmentVariable,
      usingFallback
    });
  }

  module.exports = {
    test,
    build,
    pack,
    clean,
    nugetPush,
    publish,
    listPackages,
    resolveContainerOptions
  };
})();
