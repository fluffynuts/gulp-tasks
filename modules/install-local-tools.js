const
  downloadNuget = require("./download-nuget"),
  debug = require("debug")("install-local-tools"),
  gutil = require("gulp-util"),
  exec = requireModule("exec"),
  path = require("path"),
  fs = require("fs"),
  defaultToolsFolder = "tools",
  nugetExe = "nuget.exe",
  del = require("del");

function ensureFolderExists(toolsFolder) {
  debug(`Ensuring existence of tools folder "${toolsFolder}"`);
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(toolsFolder)) {
        fs.mkdirSync(toolsFolder);
      }
      debug(`${toolsFolder} exists!`);
      resolve();
    } catch (e) {
      debug(`${toolsFolder} doesn't exist and not creatable`);
      debug(e);
      reject(e);
    }
  });
}

function cleanFoldersFrom(toolsFolder) {
  const dirs = fs.readdirSync(toolsFolder)
    .map(p => path.join(toolsFolder, p))
    .filter(p => {
      const stat = fs.lstatSync(p);
      return stat.isDirectory();
    });
  if (dirs.length) {
    debug(`Will delete the following tools sub-folders:`);
    dirs.forEach(d => {
      debug(` - ${d}`);
    });
  }
  return del(dirs);
}

function downloadOrUpdateNuget(targetFolder) {
  const nugetPath = path.join(targetFolder, "nuget.exe");
  debug(`Attempting to get tools nuget to: ${targetFolder}`);
  if (fs.existsSync(nugetPath)) {
    gutil.log("nuget.exe already exists... attempting self-update");
    return exec(nugetPath, [
      "update", "-self"
    ]);
  } else {
    return downloadNuget(targetFolder);
  }
}

module.exports = (requiredTools, overrideToolsFolder) => {
  if (!requiredTools) {
    throw new Error("No required tools set");
  }
  if (!Array.isArray(requiredTools)) {
    requiredTools = [requiredTools];
  }
  const targetFolder = overrideToolsFolder || defaultToolsFolder;
  return ensureFolderExists(targetFolder)
    .then(() => cleanFoldersFrom(targetFolder))
    .then(() => downloadOrUpdateNuget(targetFolder))
    .then(() => Promise.all(
      requiredTools.map(tool => exec(
        nugetExe,
        ["install", tool],
        { cwd: targetFolder }
      ))));
};
