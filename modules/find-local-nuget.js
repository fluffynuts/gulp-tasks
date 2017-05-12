const
  fs = require("fs"),
  path = require("path"),
  downloadNuget = require("./download-nuget")

function completedFile(path) {
    return path + '.completed';
}

var lastResolution;

function findLocalNuget() {
    const
      targetFolder = __dirname,
      localNuget = path.join(targetFolder, 'nuget.exe'),
      i = 1;
    return new Promise(function(resolve, reject) {
        if (lastResolution) {
            return resolve(lastResolution);
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

