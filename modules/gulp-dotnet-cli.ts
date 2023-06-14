(function() {
  const dotnetCli = requireModule<DotNetCli>("dotnet-cli");
  const { streamify } = requireModule<Streamify>("streamify");

  function wrap<T>(fn: (opts: T) => Promise<SpawnResult | SpawnError>): AsyncTVoid<T> {
    return async (opts: T) => {
      const result = await fn(opts);
      if (result instanceof Error) {
        throw result;
      }
      // otherwise, discard the result
    };
  }

  function pack(opts: DotnetPackOptions) {
    return streamify(
      wrap(dotnetCli.pack),
      f => {
        const copy = { ...opts };
        copy.target = f.path;
        return copy;
      },
      "gulp-dotnet-cli-pack",
      "creating nuget package"
    );
  }

  function build(opts: DotNetBuildOptions) {
    return streamify(
      wrap(dotnetCli.build),
      f => {
        const copy = { ...opts };
        copy.target = f.path;
        return copy;
      },
      "gulp-dotnet-cli-build",
      "building project or solution"
    );
  }

  function test(opts: DotnetPackOptions) {
    return streamify(
      wrap(dotnetCli.test),
      f => {
        const copy = { ...opts };
        copy.target = f.path;
        return copy;
      },
      "gulp-dotnet-cli-pack",
      "creating nuget package"
    );
  }

  module.exports = {
    build,
    test,
    pack
  };
})();
