(function() {
  const
    system = requireModule<System>("system"),
    quoteIfRequired = requireModule<QuoteIfRequired>("quote-if-required"),
    { splitPath } = requireModule<PathUtils>("path-utils"),
    dotnetCli = requireModule<DotNetCli>("dotnet-cli"),
    env = requireModule<Env>("env"),
    findLocalNuget = require("./find-local-nuget");

  function isDotnetCore(binaryPath: string) {
    const
      trimmed = binaryPath.replace(/^"/, "")
        .replace(/"$/, ""),
      parts = splitPath(trimmed),
      executable = (parts[parts.length - 1] || "");
    return !!executable.match(/^dotnet(:?\.exe)?$/i);
  }

  async function pushWithDotnet(
    opts: DotNetNugetPushOptions
  ) {
    await dotnetCli.nugetPush(opts);
  }

  async function nugetPush(
    packageFile: string,
    sourceName?: string,
    options?: NugetPushOpts
  ): Promise<void> {
    const
        nugetPushSource = sourceName || env.resolve(env.NUGET_PUSH_SOURCE);
    const apiKey = env.resolve(env.NUGET_API_KEY);
    options = options || {};
    options.skipDuplicates = options.skipDuplicates === undefined
      ? env.resolveFlag("NUGET_IGNORE_DUPLICATE_PACKAGES")
      : options.skipDuplicates;
    const nuget = await findLocalNuget();
    if (isDotnetCore(nuget)) {
      const dotnetOpts = {
        target: packageFile,
        source: nugetPushSource,
        skipDuplicates: options && options.skipDuplicates,
        apiKey
      };
      return pushWithDotnet(dotnetOpts);
    }

    // legacy mode: olde dotnet nuget code & nuget.exe logic
    const
      dnc = isDotnetCore(nuget),
      sourceArg = dnc ? "--source" : "-Source",
      // ffs dotnet core breaks things that used to be simple
      // -> _some_ nuget commands require 'dotnet nuget ...'
      // -> _others_ don't, eg 'dotnet restore'
      start = dnc ? [ "nuget" ] : [],
      args = start.concat([
        "push",
        quoteIfRequired(packageFile),
        sourceArg,
        nugetPushSource || "nuget.org"
      ]),
      apiKeyArg = dnc ? "-k" : "-ApiKey";
    if (options.skipDuplicates && dnc) {
      args.push("--skip-duplicates");
    }
    if (apiKey) {
      args.push.call(args, apiKeyArg, apiKey);
    } else if (dnc) {
      throw new Error("You must set the NUGET_API_KEY environment variable to be able to push packages with the dotnet executable");
    }
    const
      pushTimeout = env.resolve("NUGET_PUSH_TIMEOUT"),
      timeout = parseInt(pushTimeout);
    if (!isNaN(timeout)) {
      args.push(dnc ? "-t" : "-Timeout");
      args.push(timeout.toString());
    }
    if (env.resolveFlag("DRY_RUN")) {
      console.log(`nuget publish dry run: ${ nuget } ${ args.join(" ") }`);
      return;
    }
    console.log(`pushing package ${ packageFile }`);
    try {
      await system(nuget, args);
    } catch (ex) {
      const e = ex as SpawnError;
      if (Array.isArray(e.stderr)) {
        const
          errors = e.stderr.join("\n").trim(),
          isDuplicatePackageError = errors.match(/: 409 /);
        if (isDuplicatePackageError && options.skipDuplicates) {
          console.warn(`ignoring duplicate package error: ${ errors }`);
        }
      }
      throw e;
    }
  }

  module.exports = nugetPush;
})();
