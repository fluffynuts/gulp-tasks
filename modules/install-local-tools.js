const
  downloadNuget = require("./download-nuget"),
  gutil = require("gulp-util"),
  exec = requireModule("exec"),
  path = require("path"),
  fs = require("fs"),
  defaultToolsFolder = "tools",
  nugetExe = "nuget.exe",
  del = require("del");

function ensureFolderExists(toolsFolder) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(toolsFolder)) {
        fs.mkdirSync(toolsFolder);
      }
      resolve();
    } catch (e) {
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
  return del(dirs);
}

function downloadOrUpdateNuget(targetFolder) {
  const nugetPath = path.join(targetFolder, "nuget.exe");
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
              [ "install", tool ],
              { cwd: targetFolder }
            ))));
};
