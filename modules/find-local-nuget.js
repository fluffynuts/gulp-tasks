var fs = require('fs');
var path = require('path');
var HttpDownloader = require('./http-downloader');

function wasCompletedWithinADay(completed, nuget) {
    var completedExists = fs.existsSync(completed);
    var nugetExists = fs.existsSync(nuget);
    if (!completedExists || !nugetExists) {
      if (completedExists) {
        fs.unlinkSync(completed);
      }
      if (nugetExists) {
        fs.unlinkSync(nuget);
      }
      return false;
    }
    try {
        var ms = Date.parse(fs.readFileSync(completed).toString());
        if (isNaN(ms)) {
            return false;
        }
        var completedAt = new Date(ms),
            completedDelta = (new Date()) - completedAt;
        return completedDelta < 86400000;   // one day. arb.
    } catch (ignore) {
        return false;
    }
}

function completedFile(path) {
    return path + '.completed';
}

function findLocalNuget() {
    var localNuget = path.join(__dirname, 'nuget.exe'),
        completed = completedFile(localNuget),
        url = 'http://dist.nuget.org/win-x86-commandline/latest/nuget.exe';
    var i = 1;
    return new Promise(function(resolve, reject) {
        if (wasCompletedWithinADay(completed, localNuget)) {
            return resolve(localNuget);
        }
        var lastCompleted = null;
        if (fs.existsSync(completed) && fs.existsSync(localNuget)) {
            lastCompleted = fs.readFileSync(completed);
            fs.unlinkSync(completed);
        }
        var downloader = new HttpDownloader();
        downloader.download(url, localNuget).then(function(dl) {
            fs.writeFileSync(completed, new Date());
            resolve(dl);
        }).catch(function(err) {
            if (lastCompleted) {
                fs.writeFileSync(completed, lastCompleted);
                log.info(err);
                log.info('Falling back on last local nuget.exe');
                return resolve(localNuget);
            }
            reject(err);
        });
    });
}

module.exports = findLocalNuget;

