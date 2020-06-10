import * as vinyl from "vinyl";

(function() {
  // resolves the file paths found by a globbing gulp.src
  const
    collectFiles = require("./collect-files"),
    promisifyStream = require("./promisify-stream"),
    gulp = require("./gulp");

  module.exports = async function(pathSpecs: string | string[]) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!Array.isArray(pathSpecs)) {
          pathSpecs = [pathSpecs];
        }
        const target = [] as vinyl.BufferFile[];
        await promisifyStream(
          gulp.src(pathSpecs)
            .pipe(collectFiles(target))
        );
        resolve(target.map(f => f.path));
      } catch (e) {
        reject(e);
      }
    });
  }

  module.exports;
})();
