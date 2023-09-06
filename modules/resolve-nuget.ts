(function() {
  const
    os = require("os"),
    debug = requireModule<DebugFactory>("debug")(__filename),
    env = requireModule<Env>("env"),
    { chmodSync, writeFileSync, lsSync, fileExistsSync, FsEntities } = require("yafs"),
    which = requireModule<Which>("which"),
    path = require("path"),
    configGenerator = requireModule<ResolveNugetConfigGenerator>("resolve-nuget-config-generator"),
    shimNuget = requireModule<ShimNuget>("shim-nuget"),
    toolsDir = requireModule<GetToolsFolder>("get-tools-folder")(),
    log = requireModule<Log>("log"),
    findNpmBase = requireModule<FindNpmBase>("find-npm-base"),
    quoteIfRequired = requireModule<QuoteIfRequired>("quote-if-required"),
    dotnetExe = process.platform === "win32" ? "dotnet.exe" : "dotnet",
    ZarroError = requireModule<ZarroError>("zarro-error"),
    nugetExe = env.resolveFlag("DOTNET_CORE") ? dotnetExe : "nuget.exe";

  env.associate("USE_SYSTEM_NUGET", [ "install-default-tools", "nuget-restore" ]);

  function findNugetInPath() {
    try {
      if (!env.resolveFlag("USE_SYSTEM_NUGET")) {
        debug("Usage of system-wide nuget must be opted-in via USE_SYSTEM_NUGET; will prefer local nuget.exe");
        return null;
      }
      const nuget = which(nugetExe);
      log.info(`found nuget in PATH: ${ nuget }`);
      return nuget;
    } catch (ignored) {
      return null;
    }
  }

  function findInPath(file: string) {
    try {
      return which(file);
    } catch (e) {
      return null;
    }
  }

  function checkExists(nugetPath: string): Optional<string> {
    return fileExistsSync(nugetPath)
      ? nugetPath
      : undefined;
  }

  const parentOfTasksFolder = path.resolve(path.join(__dirname, "..", ".."));

  let lastResolution: Optional<string>;

  function resolveNuget(
    nugetPath: string,
    errorOnMissing?: boolean
  ) {
    if (lastResolution) {
      return lastResolution;
    }
    if (errorOnMissing === undefined) {
      errorOnMissing = true;
    }
    // search for nuget:
    //  - given path
    //  - tools/nuget.exe
    //  - nuget.exe
    //  - override-tasks/nuget.exe
    //  - local-tasks/nuget.exe
    const
      toolsContents = lsSync(
        toolsDir, {
          recurse: true,
          entities: FsEntities.files
        }) as string[],
      toolsNuget = toolsContents
        .filter(p => {
          return p.toLowerCase().endsWith(nugetExe);
        })
        .sort()[0];
    const config = configGenerator();
    const resolved = [
      checkExists(nugetPath),
      findInPath(nugetPath),
      checkExists(toolsNuget),
      checkExists(path.join(parentOfTasksFolder, nugetExe)),
      checkExists(path.join(parentOfTasksFolder, "override-tasks", nugetExe)),
      checkExists(path.join(parentOfTasksFolder, "local-tasks", nugetExe)),
      findNugetInPath(),
      findDotNetIfRequired(),
      checkExists(config.localNuget)
    ].reduce(function(acc, cur) {
      return acc || cur;
    }, null);
    if (resolved) {
      log.info(`using restore tool: ${ resolved }`);
      return (lastResolution = quoteIfRequired(
        shimNuget(resolved)
      ));
    }
    if (!errorOnMissing) {
      return undefined;
    }
    if (nugetPath) {
      throw new ZarroError(`configured restore tool: "${ nugetPath }" not found`);
    }
    throw new ZarroError(`${ config.localNuget } not found! Suggestion: add "get-local-nuget" to your pipeline`);
  }

  function findDotNetIfRequired() {
    if (!env.resolveFlag("DOTNET_CORE")) {
      return null;
    }
    return which(dotnetExe);
  }

  function resolveMonoScriptIfRequiredFor(nugetPath: string) {
    nugetPath = path.resolve(nugetPath);
    if (os.platform() === "win32") {
      return nugetPath;
    }
    const ext = path.extname(nugetPath).toLowerCase();
    if (ext !== ".exe") {
      // assume there is some other magic at play here
      return nugetPath;
    }
    const mono = which("mono");
    if (!mono) {
      throw new ZarroError("MONO is required to run nuget restore on this platform");
    }
    const baseFolder = findNpmBase();
    const script = `#!/bin/sh
mono ${ path.resolve(nugetPath) } $@`;
    const scriptPath = path.join(
      baseFolder,
      "node_modules",
      ".bin",
      "mono-nuget"
    );
    writeFileSync(scriptPath, script, { encoding: "utf-8" });
    chmodSync(scriptPath, "755");
    return path.resolve(scriptPath);
  }

  module.exports = resolveNuget;
})();
