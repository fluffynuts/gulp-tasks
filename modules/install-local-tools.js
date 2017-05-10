const
  downloadNuget = require("./download-nuget"),
  exec = requireModule("exec"),
  path = require("path"),
  fs = require("fs"),
  defaultToolsFolder = "tools",
  nugetExe = "nuget.exe",
  del = require("del");

function ensureFolderExists() {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(defaultToolsFolder)) {
        fs.mkdirSync(defaultToolsFolder);
      }
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function cleanFoldersFrom() {
  const dirs = fs.readdirSync(defaultToolsFolder)
    .map(p => path.join(defaultToolsFolder, p))
    .filter(p => {
      const stat = fs.lstatSync(p);
      return stat.isDirectory();
    });
  return del(dirs);
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
          .then(() => downloadNuget(targetFolder))
          .then(() => Promise.all(
            requiredTools.map(tool => exec(
              nugetExe,
              [ "install", tool ],
              { cwd: targetFolder }
            ))));
};
