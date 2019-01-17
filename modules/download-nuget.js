const
  HttpDownloader = require("./http-downloader"),
  exec = require("./exec"),
  logger = require("./log"),
  path = require("path"),
  url = 'http://dist.nuget.org/win-x86-commandline/latest/nuget.exe';

function downloadNugetTo(targetFolder) {
  logger.debug(`Attempting to download nuget.exe to ${targetFolder}`);
  const
    downloader = new HttpDownloader(),
    target = path.join(targetFolder, "nuget.exe");
  return downloader
    .download(url, path.join(targetFolder, "nuget.exe"))
    .then(() => validateCanRunExe(target));
}

function validateCanRunExe(exePath) {
  return new Promise((resolve, reject) => {
    var
      lastMessage = "unknown error",
      attempts = 0;
    setTimeout(function testExe() {
      if (attempts === 10) {
        return reject(`Unable to run executable at ${exePath}: ${lastMessage}`);
      }
      attempts++;
      try {
        logger.debug(`attempt #${attempts} to run ${exePath}`);
        exec(exePath, ["update", "-self"]);
        logger.info(`nuget.exe appears to be valid!`);
        return resolve();
      } catch (e) {
        lastMessage = e.message || lastMessage;
        logger.debug(`failed to run executable (${e.message}); ${i < 9 ? "will try again" : "giving up"}`);
      }

      setTimeout(testExe, 1000);
    }, 1000);
  });
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
