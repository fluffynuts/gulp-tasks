(function () {
  const spawn = requireModule<Spawn>("spawn");

  async function test(opts: DotNetTestOptions): Promise<SpawnResult | SpawnError> {
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
    } catch (e) {
      return e as SpawnError;
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
      args.push("--logger", build.join(";"));
    }
  }

  function pushIfSet(args: string[], value: Optional<string>, cliSwitch: string) {
    if (value) {
      args.push(cliSwitch, value);
    }
  }

  function pushFlag(args: string[], value: Optional<boolean>, cliSwitch: string) {
    if (value) {
      args.push(cliSwitch);
    }
  }

  module.exports = {
    test
  };
})();
