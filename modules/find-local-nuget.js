const
  fs = require("fs"),
  path = require("path"),
  resolveNuget = require("./resolve-nuget"),
  downloadNuget = require("./download-nuget")

function completedFile(path) {
    return path + '.completed';
}

var lastResolution;

function findLocalNuget() {
    const
      targetFolder = __dirname,
      localNuget = resolveNuget(undefined, false) || path.join(targetFolder, 'nuget.exe');
    return new Promise(function(resolve, reject) {
        if (lastResolution) {
            return resolve(lastResolution);
        }
        if (fs.existsSync(localNuget)) {
            return resolve(localNuget);
        }
        downloadNuget(targetFolder).then(function(dl) {
            lastResolution = dl;
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

