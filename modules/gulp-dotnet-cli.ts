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

  function publish(
    opts: DotNetPublishOptions
  ) {
    return streamify(
      wrap(dotnetCli.publish),
      f => {
        const copy = { ...opts };
        copy.target = f.path;
        return copy;
      },
      "gulp-dotnet-cli-publish",
      "publishing dotnet project"
    )
  }

  module.exports = {
    build,
    clean,
    test,
    pack,
    nugetPush,
    publish
  } as GulpDotNetCli;
})();
