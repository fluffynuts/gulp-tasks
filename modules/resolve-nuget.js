const os = require("os"),
  debug = require("debug")("resolve-nuget"),
  env = requireModule("env"),
  fs = requireModule("fs"),
  path = require("path"),
  which = require("which"),
  configGenerator = requireModule("config-generator"),
  lsR = require("./ls-r"),
  toolsDir = require("./get-tools-folder")(),
  findNpmBase = require("./find-npm-base"),
  quoteIfRequired = require("./quote-if-required"),
  nugetExe = "nuget.exe";

env.associate("USE_SYSTEM_NUGET", [ "install-default-tools", "nuget-restore" ]);

function findNugetInPath() {
  try {
    if (!env.resolveFlag("USE_SYSTEM_NUGET")) {
      debug("Usage of system-wide nuget must be opted-in via USE_SYSTEM_NUGET; will prefer local nuget.exe");
      return null;
    }
    const nuget = which.sync("nuget");
    log.info(`found nuget in PATH: ${nuget}`);
    return nuget;
  } catch (ignored) {
    return null;
  }
}

function checkExists(nugetPath) {
  return fs.existsSync(nugetPath) ? nugetPath : null;
}

const parentOfTasksFolder = path.resolve(path.join(__dirname, "..", ".."));

let lastResolution = null;
function resolveNuget(nugetPath, errorOnMissing) {
  if (lastResolution !== null) {
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
  const toolsContents = lsR(toolsDir),
    toolsNuget = toolsContents
      .filter(function(path) {
        return path.toLowerCase().endsWith(nugetExe);
      })
      .sort()[0];
  const config = configGenerator();
  const resolved = [
    checkExists(nugetPath),
    checkExists(toolsNuget),
    checkExists(path.join(parentOfTasksFolder, nugetExe)),
    checkExists(path.join(parentOfTasksFolder, "override-tasks", nugetExe)),
    checkExists(path.join(parentOfTasksFolder, "local-tasks", nugetExe)),
    findNugetInPath(),
    checkExists(config.localNuget)
  ].reduce(function(acc, cur) {
    return acc || cur;
  }, null);
  if (resolved) {
    log.info(`using nuget: ${resolved}`);
    return (lastResolution = quoteIfRequired(
      resolveMonoScriptIfRequiredFor(resolved)
    ));
  }
  if (!errorOnMissing) {
    return undefined;
  }
  if (nugetPath) {
    throw `configured nuget: "${nugetPath}" not found`;
  }
  throw `${config.localNuget} not found! Suggestion: add "get-local-nuget" to your pipeline`;
}

function resolveMonoScriptIfRequiredFor(nugetPath) {
  nugetPath = path.resolve(nugetPath);
  if (os.platform() === "win32") {
    return nugetPath;
  }
  const ext = path.extname(nugetPath).toLowerCase();
  if (ext !== ".exe") {
    // assume there is some other magic at play here
    return nugetPath;
  }
  const mono = which.sync("mono", { nothrow: true });
  if (!mono) {
    throw new Error("MONO is required to run nuget restore on this platform");
  }
  const baseFolder = findNpmBase();
  const script = `#!/bin/sh
mono ${path.resolve(nugetPath)} $@`;
  const scriptPath = path.join(
    baseFolder,
    "node_modules",
    ".bin",
    "mono-nuget"
  );
  fs.writeFileSync(scriptPath, script, { encoding: "utf-8" });
  fs.chmodSync(scriptPath, "755");
  return path.resolve(scriptPath);
}

module.exports = resolveNuget;
