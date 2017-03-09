var fs = require('fs');
var path = require('path');
var HttpDownloader = require('./http-downloader');

function completedFile(path) {
    return path + '.completed';
}

var lastResolution;

function findLocalNuget() {
    var localNuget = path.join(__dirname, 'nuget.exe'),
        url = 'http://dist.nuget.org/win-x86-commandline/latest/nuget.exe';
    var i = 1;
    return new Promise(function(resolve, reject) {
        if (lastResolution) {
            return resolve(lastResolution);
        }
        var downloader = new HttpDownloader();
        downloader.download(url, localNuget).then(function(dl) {
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

