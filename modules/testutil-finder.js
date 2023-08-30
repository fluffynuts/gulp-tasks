"use strict";
(function () {
    "use strict";
    const log = requireModule("log"), fs = require("fs"), path = require("path"), debug = requireModule("debug")(__filename), lsR = require("./ls-r"), programFilesFolder = process.env["ProgramFiles(x86)"]
        || process.env["ProgramFiles"], getToolsFolder = requireModule("get-tools-folder"), ZarroError = requireModule("zarro-error"), which = requireModule("which"), localAppDataFolder = process.env["LOCALAPPDATA"];
    function isUnstable(folderName) {
        return folderName.indexOf("alpha") > -1 ||
            folderName.indexOf("beta") > -1;
    }
    function finder(searchBaseFolders, searchBaseSubFolder, searchFolderPrefix, searchBin, options) {
        const ignoreBetas = options.ignoreBetas === undefined ? true : options.ignoreBetas, lprefix = searchFolderPrefix.toLowerCase();
        if (!Array.isArray(searchBaseFolders)) {
            searchBaseFolders = [searchBaseFolders];
        }
        const runner = searchBaseFolders
            .filter(f => !!f)
            .map(f => {
            return searchBaseSubFolder
                ? path.join(f, searchBaseSubFolder)
                : f;
        })
            .filter(checkExists)
            .reduce((possibles, baseFolder) => {
            debug("Searching: " + baseFolder);
            return fs.readdirSync(baseFolder)
                .reduce((acc, cur) => {
                const folder = path.join(baseFolder, cur);
                const lcur = cur.toLowerCase();
                if (lcur.indexOf(lprefix) === 0) {
                    if (ignoreBetas && isUnstable(lcur)) {
                        log.notice("Ignoring unstable tool at: " + folder);
                        return acc;
                    }
                    const match = cur.match(/\d+/g);
                    if (!match) {
                        return acc;
                    }
                    const version = match.map(Number);
                    debug(`Adding possible: ${folder} = version ${version}`);
                    acc.push({
                        folder: folder,
                        version: version
                    });
                }
                return acc;
            }, possibles);
        }, [])
            .sort((x, y) => compareVersionArrays(x.version, y.version))
            .map((possible) => path.join(possible.folder, searchBin))
            .find(checkExists);
        if (runner) {
            log.debug("Using " + runner);
        }
        return runner;
    }
    function compareVersionArrays(x, y) {
        const shortest = Math.min(x.length, y.length), compare = [];
        for (let i = 0; i < shortest; i++) {
            if (x[i] > y[i]) {
                compare[i] = ">";
            }
            else if (x[i] < y[i]) {
                compare[i] = "<";
            }
            else {
                compare[i] = "0";
            }
        }
        if (compare.length === 0) {
            return 0;
        }
        const allZero = compare.reduce((acc, cur) => acc && (cur === "0"), true);
        if (allZero) {
            return 0;
        }
        for (const s of compare) {
            if (s === ">") {
                return -1;
            }
            else if (s === "<") {
                return 1;
            }
        }
        return 0;
    }
    function findWrapper(func, name) {
        const found = func();
        if (!found) {
            debug(`Can't find any installed ${name}`);
        }
        return found;
    }
    function findInstalledNUnit3() {
        if (!programFilesFolder) {
            return null;
        }
        const search = path.join(programFilesFolder, "NUnit.org", "nunit-console", "nunit3-console.exe");
        if (!search) {
            return null;
        }
        return fs.existsSync(search) ? search : null;
    }
    function checkExists(somePath) {
        debug(`Checking if file exists: ${somePath}`);
        return fs.existsSync(somePath) ? somePath : undefined;
    }
    function tryToFindNUnit(options) {
        return initialToolSearch("nunit3-console.exe", "NUNIT") ||
            searchForNunit(options);
    }
    function latestNUnit(options) {
        const result = tryToFindNUnit(options);
        debug(`Using nunit runner: ${result || "NOT FOUND"}`);
        return result;
    }
    function nunit2Finder(searchBin, options) {
        if (!programFilesFolder) {
            return undefined;
        }
        return finder([programFilesFolder], undefined, "NUnit", searchBin, options);
    }
    function searchForNunit(options) {
        options = options || {};
        const isX86 = (options.x86 || ((options.platform || options.architecture) === "x86"));
        const runner = isX86 ? "/bin/nunit-console-x86.exe" : "/bin/nunit-console.exe";
        return findWrapper(function () {
            return findInstalledNUnit3() || nunit2Finder(runner, options);
        }, "nunit-console runner");
    }
    function findTool(exeName, underFolder) {
        const allResults = lsR(underFolder || getToolsFolder())
            .filter((p) => p.toLowerCase()
            .endsWith(exeName.toLowerCase()))
            .sort();
        return allResults[0] || which(exeName);
    }
    function locateDotCover(options) {
        options = options || {};
        return initialToolSearch("dotCover.exe", "DOTCOVER") ||
            findWrapper(function () {
                return finder([programFilesFolder, localAppDataFolder], "JetBrains/Installations", "dotCover", "dotCover.exe", options)
                    || finder([programFilesFolder], "JetBrains/dotCover", "v", "Bin/dotCover.exe", options);
            }, "dotCover");
    }
    function latestDotCover(options) {
        const result = locateDotCover(options);
        debug(`Using dotCover: ${result || "NOT FOUND"}`);
        return result;
    }
    function initialToolSearch(toolExe, environmentVariable) {
        const fromEnvironment = process.env[environmentVariable];
        if (fromEnvironment) {
            if (!fs.existsSync(fromEnvironment)) {
                throw new ZarroError(`${fromEnvironment} specified in environment variable ${environmentVariable} not found`);
            }
            return fromEnvironment;
        }
        return findTool(toolExe);
    }
    function latestOpenCover() {
        const result = initialToolSearch("OpenCover.Console.exe", "OPENCOVER");
        debug(`Using opencover: ${result || "NOT FOUND"}`);
        return result;
    }
    module.exports = {
        latestNUnit: latestNUnit,
        latestDotCover: latestDotCover,
        latestOpenCover: latestOpenCover,
        findTool: findTool,
        nunit2Finder: nunit2Finder,
        compareVersionArrays: compareVersionArrays
    };
})();
