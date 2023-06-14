(function() {
  const spawn = requireModule<Spawn>("spawn");
  const q = requireModule<QuoteIfRequired>("quote-if-required");

  async function build(
    opts: DotNetBuildOptions
  ): Promise<SpawnResult | SpawnError> {
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
    pushProperties(args, opts);
    pushAdditionalArgs(args, opts);

    return runDotNetWith(args, opts);
  }

  async function test(
    opts: DotNetTestOptions
  ): Promise<SpawnResult | SpawnError> {
    const args = [
      "test",
      q(opts.target)
    ];
    pushCommonBuildArgs(args, opts);

    pushIfSet(args, opts.settingsFile, "--settings");
    pushIfSet(args, opts.filter, "--filter")
    pushIfSet(args, opts.diagnostics, "--diag");
    pushNoBuild(args, opts);
    pushNoRestore(args, opts);

    pushLoggers(args, opts.loggers);
    pushProperties(args, opts);
    pushEnvVars(args, opts.env);
    pushAdditionalArgs(args, opts);

    return runDotNetWith(args, opts);

  }

  async function pack(
    opts: DotnetPackOptions
  ): Promise<SpawnResult | SpawnError> {
    const args = [
      "pack",
      q(opts.target)
    ];
    pushVerbosity(args, opts);
    pushOutput(args, opts);
    pushConfiguration(args, opts);
    pushNoBuild(args, opts);

    pushFlag(args, opts.includeSymbols, "--include-symbols");
    pushFlag(args, opts.includeSource, "--include-source");
    pushNoRestore(args, opts);
    pushVersionSuffix(args, opts);
    return runDotNetWith(args, opts);
  }

  function pushCommonBuildArgs(
    args: string[],
    opts: DotNetTestOptions
  ) {
    pushVerbosity(args, opts);
    pushConfiguration(args, opts);
    pushIfSet(args, opts.framework, "--framework");
    pushIfSet(args, opts.runtime, "--runtime");
    pushIfSet(args, opts.arch, "--arch");
    pushIfSet(args, opts.os, "--os");
    pushOutput(args, opts);
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

  function pushConfiguration(
    args: string[],
    opts: DotNetTestOptions
  ) {
    pushIfSet(args, opts.configuration, "--configuration");
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
    consumers: IoConsumers
  ): Promise<SpawnResult | SpawnError> {
    try {
      return await spawn("dotnet", args, {
        stdout: consumers.stdout,
        stderr: consumers.stderr
      });
    } catch (e) {
      return e as SpawnError;
    }
  }

  function pushProperties(args: string[], opts: DotNetBaseOptions) {
    if (!opts.msbuildProperties) {
      return;
    }
    for (const key of Object.keys(opts.msbuildProperties)) {
      args.push(
        `/p:${ q(key) }=${ q(opts.msbuildProperties[key]) }`
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
      args.push("--logger", build.join(";"));
    }
  }

  function pushIfSet(args: string[], value: Optional<string>, cliSwitch: string) {
    if (value) {
      args.push(cliSwitch, q(value));
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
    pack
  };
})();
