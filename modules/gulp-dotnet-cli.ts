(function() {
  const dotnetCli = requireModule<DotNetCli>("dotnet-cli");
  const { streamify } = requireModule<Streamify>("streamify");
  const env = requireModule<Env>("env");
  const path = require("path");
  const { fileExists } = require("yafs");

  function wrap<T>(fn: (opts: T) => Promise<SpawnResult | SpawnError>): AsyncTVoid<T> {
    return async (opts: T) => {
      const result = await fn(opts);
      if (result instanceof Error) {
        throw result;
      }
      // otherwise, discard the result
    };
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

  function clean(opts: DotNetCleanOptions) {
    return streamify(
      wrap(dotnetCli.clean),
      f => {
        const copy = { ...opts };
        copy.target = f.path;
        return copy;
      },
      "gulp-dotnet-cli-clean",
      "cleaning project or solution"
    )
  }

  function test(opts: DotNetPackOptions) {
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

  function pack(opts: DotNetPackOptions) {
    return streamify(
      wrap(dotnetCli.pack),
      async f => {
        const copy = { ...opts };
        copy.target = f.path;
        const containingFolder = path.dirname(f.path);
        const supplementaryNuspec = path.resolve(
          path.join(
            containingFolder,
            env.resolve(env.PACK_SUPPLEMENTARY_NUSPEC)
          )
        )
        if (await fileExists(supplementaryNuspec)) {
          copy.nuspec = supplementaryNuspec
        }
        return copy;
      },
      "gulp-dotnet-cli-pack",
      "creating nuget package"
    );
  }

  function nugetPush(opts: DotNetNugetPushOptions) {
    return streamify(
      wrap(dotnetCli.nugetPush),
      f => {
        const copy = { ...opts };
        copy.target = f.path;
        return copy
      },
      "gulp-dotnet-cli-nuget-push",
      "pushing nuget package"
    )
  }

  module.exports = {
    build,
    clean,
    test,
    pack,
    nugetPush
  } as GulpDotNetCli;
})();
