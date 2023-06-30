"use strict";
(function () {
    // replaces the gulp-npm-run node module
    // which relies on ramda -- that keeps on having
    // breaking changes released. NO MORE.
    const { readFileSync } = require("fs"), debug = require("debug")("gulp-npm-run"), exec = require("./exec"), path = require("path"), chalk = requireModule("ansi-colors"), { ZarroError } = requireModule("zarro-error"), findNpmBase = require("./find-npm-base");
    function gulpNpmRun(gulp) {
        const packageIndex = findPackageIndex(), scripts = packageIndex.scripts || {};
        Object.keys(scripts).forEach(k => {
            gulp.task(k, `npm script: ${k}`, async () => {
                // npm run produces extra output, prefixed with >
                // at the start, including package information and the script line
                // -> we'll ignore it unless someone _really_ wants it
                let ignoredFirstLine = false;
                await exec("npm", ["run", k], undefined, {
                    stderr: (d) => console.error(chalk.red(d)),
                    stdout: (d) => {
                        if (!ignoredFirstLine) {
                            debug(`npm diagnostics:\n${d}`);
                            ignoredFirstLine = true;
                            return;
                        }
                        console.log(chalk.yellow(d));
                    }
                });
            });
        });
    }
    function findPackageIndex() {
        const packageIndexFolder = findNpmBase(), packageIndexPath = path.join(packageIndexFolder, "package.json");
        try {
            const contents = readFileSync(packageIndexPath, { encoding: "utf8" });
            return JSON.parse(contents);
        }
        catch (e) {
            throw new ZarroError(`Unable to read package.json at ${packageIndexPath}`);
        }
    }
    module.exports = gulpNpmRun;
})();
