const fs = require("fs"),
  path = require("path"),
  which = require("which"),
  config = require("./config"),
  lsR = require("./ls-r"),
  toolsDir = require("./get-tools-folder")(),
  nugetExe = "nuget.exe";

function findNugetInPath() {
  try {
    const nuget = which.sync("nuget");
    log.info(`Using pathed ${nugetExe} from: ${nuget}`);
    return nuget;
  } catch (ignored) {
    return null;
  }
}

function checkExists(nugetPath) {
  return fs.existsSync(nugetPath) ? nugetPath : null;
}

const parentOfTasksFolder = path.resolve(path.join(__dirname, "..", ".."));

function resolveNuget(nugetPath, errorOnMissing) {
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
      toolsNuget = toolsContents.filter(function(path) {
        return path.toLowerCase().endsWith(nugetExe);
      }).sort()[0];
  const resolved = [
    checkExists(nugetPath),
    checkExists(toolsNuget),
    checkExists(path.join(parentOfTasksFolder, nugetExe)),
    checkExists(path.join(parentOfTasksFolder, "override-tasks", nugetExe)),
    checkExists(path.join(parentOfTasksFolder, "local-tasks", nugetExe)),
    findNugetInPath(),
    checkExists(config.localNuget)
  ].reduce(function (acc, cur) {
    return acc || cur;
  }, null);
  if (resolved) {
    return resolved;
  }
  if (!errorOnMissing) {
    return undefined;
  }
  if (nugetPath) {
    throw `configured nuget: "${nugetPath}" not found`;
  }
  throw `${config.localNuget} not found! Suggestion: add "get-local-nuget" to your pipeline`;
}


module.exports = resolveNuget;

