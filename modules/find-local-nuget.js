const
  fs = require("fs"),
  path = require("path"),
  resolveNuget = require("./resolve-nuget"),
  pathUnquote = require("./path-unquote"),
  downloadNuget = require("./download-nuget"),
  env = require("./env");

let startedDownload = false,
  resolver = null,
  lastResolution = new Promise(function (resolve) {
    resolver = resolve;
  });

function findLocalNuget() {
  const
    targetFolder = env.resolve("BUILD_TOOLS_FOLDER"),
    localNuget = resolveNuget(undefined, false) || path.join(targetFolder, 'nuget.exe');
  return new Promise(function(resolve, reject) {
    if (startedDownload && lastResolution) {
      return resolve(lastResolution);
    }
    if (fs.existsSync(pathUnquote(localNuget))) {
      return resolve(localNuget);
    }
    startedDownload = true;
    downloadNuget(targetFolder).then(function(dl) {
      resolver(dl); // = dl;
      resolve(dl);
    }).catch(function(err) {
      if (fs.existsSync(localNuget)) {
        log.info(err);
        log.info('Falling back on last local nuget.exe');
        lastResolution = localNuget;
        return resolve(localNuget);
      }
      reject(err);
    });
  });
}

module.exports = findLocalNuget;
