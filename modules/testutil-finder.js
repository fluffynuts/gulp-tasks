"use strict";
var
  log = require("./log"),
  fs = require("fs"),
  path = require("path"),
  debug = require("debug")("testutil-finder"),
  lsR = require("./ls-r"),
  whichLib = require("which"),
  programFilesFolder = process.env["ProgramFiles(x86)"] || process.env["ProgramFiles"],
  localAppDataFolder = process.env["LOCALAPPDATA"];

function which(command) {
  try {
    return whichLib.sync(command, {});
  } catch (e) {
    return undefined;
  }
}

function isUnstable(folderName) {
  return folderName.indexOf("alpha") > -1 ||
    folderName.indexOf("beta") > -1;
}

function finder(searchBaseFolders, searchBaseSubFolder, searchFolderPrefix, searchBin, options) {
  const
    ignoreBetas = options.ignoreBetas === undefined ? true : options.ignoreBetas,
    lprefix = searchFolderPrefix.toLowerCase();
  const runner = searchBaseFolders
    .map(f => searchBaseSubFolder ? path.join(f, searchBaseSubFolder) : f)
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
            var version = cur.match(/\d+/g).map(Number);
            debug(`Adding possible: ${folder} = version ${version}`);
            acc.push({
              folder: folder,
              version: version
            });
          }
          return acc;
        }, possibles);
    }, [])
    .sort((x,y) => -compareVersionArrays(x.version, y.version))
    .map(possible => path.join(possible.folder, searchBin))
    .find(checkExists);
  if (runner) {
    log.debug("Using " + runner);
  }
  return runner;
}

function compareVersionArrays(x, y) {
  return x.reduce((acc, cur, i) => acc || cur - y[i] || 0, 0) || x.length - y.length;
}

function findWrapper(func, name) {
  var found = func();
  if (!found) {
    debug(`Can't find any installed ${name}`);
  }
  return found;
}

var findInstalledNUnit3 = function () {
  var search = path.join(programFilesFolder, "NUnit.org", "nunit-console", "nunit3-console.exe");
  return fs.existsSync(search) ? search : null;
};

function checkExists(somePath) {
  return fs.existsSync(somePath) ? somePath : undefined;
}

function tryToFindNUnit(options) {
  return initialToolSearch("nunit3-console.exe", "NUNIT") ||
    searchForNunit(options);
}

function latestNUnit(options) {
  var result = tryToFindNUnit(options);
  debug(`Using nunit runner: ${result || "NOT FOUND"}`);
  return result;
}

function nunit2Finder(searchBin, options) {
  return finder([programFilesFolder], undefined, "NUnit", runner, options);
}

function searchForNunit(options) {
  options = options || {};
  var isX86 = (options.x86 || ((options.platform || options.architecture) === "x86"));
  var runner = isX86 ? "/bin/nunit-console-x86.exe" : "/bin/nunit-console.exe";
  return findWrapper(function () {
    return findInstalledNUnit3() || nunit2Finder(runner, options);
  }, "nunit-console runner");
}

function findTool(exeName) {
  return lsR("tools").filter(function (p) {
    return p.toLowerCase().endsWith(exeName.toLowerCase());
  })[0] || which(exeName);
}

function locateDotCover(options) {
  options = options || {};
  return initialToolSearch("dotCover.exe", "DOTCOVER") ||
    findWrapper(function () {
      return finder([programFilesFolder, localAppDataFolder], "JetBrains/Installations", "dotCover", "dotCover.exe", options)
        || finder(programFilesFolder, "JetBrains/dotCover", "v", "Bin/dotCover.exe", options);
    }, "dotCover");
}

function latestDotCover(options) {
  var result = locateDotCover(options);
  debug(`Using dotCover: ${result || "NOT FOUND"}`);
  return result;
}

function initialToolSearch(toolExe, environmentVariable) {
  var fromEnvironment = process.env[environmentVariable];
  if (fromEnvironment) {
    if (!fs.existsSync(fromEnvironment)) {
      throw new Error(`${fromEnvironment} specified in environment variable ${environmentVariable} not found`);
    }
    return fromEnvironment;
  }
  return findTool(toolExe);
}

function latestOpenCover() {
  var result = initialToolSearch("OpenCover.Console.exe", "OPENCOVER");
  debug(`Using opencover: ${result || "NOT FOUND"}`);
  return result;
}

module.exports = {
  latestNUnit: latestNUnit,
  latestDotCover: latestDotCover,
  latestOpenCover: latestOpenCover,
  findTool: findTool
};
