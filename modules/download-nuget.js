const
  HttpDownloader = require("./http-downloader"),
  path = require("path"),
  url = 'http://dist.nuget.org/win-x86-commandline/latest/nuget.exe';

function downloadNugetTo(targetFolder) {
  const downloader = new HttpDownloader();
  return downloader.download(url, path.join(targetFolder, "nuget.exe"));
}

function retry(fn, attempt, maxAttempts, wait) {
  attempt = attempt || 0;
  maxAttempts = maxAttempts || 10;
  wait = wait || 5000;
  if (wait < 1000) {
    wait *= 1000;
  }
  return fn().catch(e => {
    if (attempt >= maxAttempts) {
      throw new Error(`${e} (giving up after ${attempt} attempts)`);
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.warn(e);
          console.log(`trying again in ${wait / 1000}s (${++attempt} / ${maxAttempts})`);
          retry(fn, attempt, maxAttempts).then(function () {
            resolve(Array.from(arguments));
          }).catch(function () {
            reject(Array.from(arguments));
          });
        }, wait);
      });
    }
  });
}

module.exports = (targetFolder) => {
  return retry(() => downloadNugetTo(targetFolder));
};
