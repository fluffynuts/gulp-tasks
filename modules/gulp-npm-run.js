"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    // replaces the gulp-npm-run node module
    // which relies on ramda -- that keeps on having
    // breaking changes released. NO MORE.
    const { readFileSync } = require("fs"), debug = requireModule("debug")(__filename), exec = requireModule("exec"), path = require("path"), chalk = requireModule("ansi-colors"), ZarroError = requireModule("zarro-error"), findNpmBase = requireModule("find-npm-base"), npmScripts = new Set();
    function gulpNpmRun(gulp) {
        const packageIndex = findPackageIndex(), scripts = packageIndex.scripts || {};
        Object.keys(scripts).forEach(k => {
            npmScripts.add(k);
            gulp.task(k, `npm script: ${k}`, async () => {
                if (alreadyRunningScript(k)) {
                    throw new ZarroError(`cyclic npm script import: ${k} - did you forget to define a task in local-tasks?`);
                }
                storeRunningScript(k);
                // npm run produces extra output, prefixed with >
                // at the start, including package information and the script line
                // -> we'll ignore it unless someone _really_ wants it
                let ignoredFirstLine = false;
                await exec("npm", ["run", k], undefined, {
                    stderr: (d) => console.error(d),
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
    const scriptMarkerVar = "ZARRO_RUNNING_NPM_SCRIPTS";
    function alreadyRunningScript(k) {
        return (process.env[scriptMarkerVar] || "")
            .split(",")
            .includes(k);
    }
    function storeRunningScript(k) {
        const existing = (process.env[scriptMarkerVar] || ""), update = !!existing
            ? `${existing},${k}`
            : k;
        process.env[scriptMarkerVar] = update;
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
    function isNpmScript(name) {
        return npmScripts.has(name);
    }
    module.exports = {
        gulpNpmRun,
        isNpmScript
    };
})();
