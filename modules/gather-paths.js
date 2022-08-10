"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    // resolves the file paths found by a globbing gulp.src
    const collectFiles = require("./collect-files"), promisifyStream = require("./promisify-stream"), gulp = require("./gulp");
    module.exports = async function (pathSpecs, throwForNoMatches) {
        if (!Array.isArray(pathSpecs)) {
            pathSpecs = [pathSpecs];
        }
        const target = [];
        await promisifyStream(gulp.src(pathSpecs)
            .pipe(collectFiles(target)));
        if (target.length === 0 && throwForNoMatches) {
            throw new Error(`No paths match provided path specs ${pathSpecs.join(",")}`);
        }
        return target.map(f => f.path);
    };
    module.exports;
})();
