"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    // resolves the file paths found by a globbing gulp.src
    const collectFiles = require("./collect-files"), promisifyStream = require("./promisify-stream"), gulp = require("./gulp-with-help");
    module.exports = async function (pathSpecs) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!Array.isArray(pathSpecs)) {
                    pathSpecs = [pathSpecs];
                }
                const target = [];
                await promisifyStream(gulp.src(pathSpecs)
                    .pipe(collectFiles(target)));
                resolve(target.map(f => f.path));
            }
            catch (e) {
                reject(e);
            }
        });
    };
    module.exports;
})();
