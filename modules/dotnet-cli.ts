import { config } from "yargs";

(function() {
  // TODO: perhaps one day, this should become an npm module of its own
  type PerConfigurationFunction = (configuration: string) => Promise<SpawnResult | SpawnError>;
  const spawn = requireModule<Spawn>("spawn");
  const { isSpawnError } = spawn;
  const { yellow } = require("ansi-colors");
  const q = requireModule<QuoteIfRequired>("quote-if-required");

  let defaultNugetSource: string;

  function showHeader(label: string) {
    console.log(yellow(label));
  }

  async function publish(
    opts: DotNetPublishOptions
  ): Promise<SpawnResult | SpawnError> {
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
        pushSelfContained(args, opts);
        pushArch(args, opts);
        pushDisableBuildServers(args, opts);

        pushVerbosity(args, opts);
        return runDotNetWith(args, opts);
      }
    )
  }

  async function clean(
    opts: DotNetCleanOptions
  ): Promise<SpawnResult | SpawnError> {
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
  ): Promise<SpawnResult | SpawnError> {
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
      });
  }

  async function test(
    opts: DotNetTestOptions
  ): Promise<SpawnResult | SpawnError> {
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
      });
  }

  async function pack(
    opts: DotNetPackOptions
  ): Promise<SpawnResult | SpawnError> {
    return runOnAllConfigurations(
      "Packing",
      opts,
      configuration => {
        const copy = { ...opts, msbuildProperties: { ...opts.msbuildProperties } }
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
        pushVersionSuffix(args, copy);
        if (copy.nuspec) {
          copy.msbuildProperties = copy.msbuildProperties || {};
          copy.msbuildProperties["NuspecFile"] = copy.nuspec;
        }
        pushMsbuildProperties(args, copy)
        pushAdditionalArgs(args, copy);
        return runDotNetWith(args, copy);
      });
  }

  async function nugetPush(
    opts: DotNetNugetPushOptions
  ): Promise<SpawnResult | SpawnError> {
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
    pushAdditionalArgs(args, opts);
    return runDotNetWith(args, opts);
  }

  function pushSelfContained(
    args: string[],
    opts: DotNetPublishOptions
  ) {
    if (opts.runtime === undefined) {
      return;
    }
    args.push(
      !!opts.selfContained
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
  ): Promise<SpawnResult | SpawnError> {
    validate(opts);
    let configurations = resolveConfigurations(opts);
    if (configurations.length < 1) {
      configurations = [ ...defaultConfigurations ]
    }
    let lastResult: Optional<SpawnResult>;
    for (const configuration of configurations) {
      showHeader(`${ label } ${ q(opts.target) } with configuration ${ configuration }`)
      const thisResult = await toRun(configuration);
      if (isSpawnError(thisResult)) {
        return thisResult;
      }
      lastResult = thisResult;
    }
    // for simplicity: return the last spawn result (at least for now, until there's a reason to get clever)
    if (lastResult === undefined) {
      // this is really here for TS
      throw new Error(`No build configurations could be determined, which is odd, because there's even a fallback.`);
    }
    return lastResult;
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
    const lines = [] as string[];
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

  // this is actually a viable configuration... but we're going to use
  // it as a flag to not put in -c at all
  const defaultConfigurations = [ "default" ];

  function resolveConfigurations(opts: { configuration?: string | string[] }): string[] {
    if (!opts.configuration) {
      return defaultConfigurations;
    }
    return Array.isArray(opts.configuration)
      ? opts.configuration
      : [ opts.configuration ];
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
    debugger;
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
  ): Promise<SpawnResult | SpawnError> {
    try {
      return await spawn("dotnet", args, {
        stdout: opts.stdout,
        stderr: opts.stderr,
        suppressStdIoInErrors: opts.suppressStdIoInErrors
      });
    } catch (e) {
      if (opts.suppressErrors) {
        return e as SpawnError;
      }
      throw e;
    }
  }

  function pushMsbuildProperties(args: string[], opts: DotNetBaseOptions) {
    if (!opts.msbuildProperties) {
      return;
    }
    for (const key of Object.keys(opts.msbuildProperties)) {
      args.push(
        `-p:${ q(key) }=${ q(opts.msbuildProperties[key]) }`
      )
    }
  }

  function pushEnvVars(args: string[], env?: Dictionary<string>) {
    if (!env) {
      return;
    }
    for (const key of Object.keys(env)) {
      args.push("-e");
      args.push(
        `${ q(key) }=${ q(env[key]) }`
      )
    }
  }

  function pushLoggers(args: string[], loggers: Optional<DotNetTestLoggers>) {
    if (!loggers) {
      return;
    }
    for (const loggerName of Object.keys(loggers)) {
      const build = [ loggerName ];
      const options = loggers[loggerName];
      for (const key of Object.keys(options)) {
        const value = options[key];
        build.push([ key, value ].join("="));
      }
      args.push("--logger", `"${ build.join(";") }"`);
    }
  }

  function pushIfSet(
    args: string[],
    value: Optional<string | number>,
    cliSwitch: string
  ) {
    if (value) {
      args.push(cliSwitch, q(`${ value }`));
    }
  }

  function pushFlag(args: string[], value: Optional<boolean>, cliSwitch: string) {
    if (value) {
      args.push(cliSwitch);
    }
  }

  module.exports = {
    test,
    build,
    pack,
    clean,
    nugetPush,
    publish
  };
})();
