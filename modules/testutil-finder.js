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

/**
 * @param {(String|String[])} [searchBaseFolders=programFilesFolder] - Base folder or array of folders.
 * @param {String} [searchBaseSubFolder] - sub folder to add to the searchBaseFolders.
 * @param {String} searchFolderPrefix - prefix of folders to search within each base + subfolder.
 * @param {String} searchBin - executable filename/path to search for within  matching folders.
 * @param {Object} [options] - optional options for the search.
 * @param {Boolean} [options.ignoreBetas] - ignore paths with alpha or beta in the name.
 */
function finder(searchBaseFolders, searchBaseSubFolder, searchFolderPrefix, searchBin, options) {
  const args = [].slice.call(arguments, 0, 5);
  if (typeof args[args.length - 1] !== "object") {
    args[args.length] = {};
  }
  searchBaseSubFolder = args.length < 5 ? undefined : args[1];
  searchBaseFolders = [].concat(args.length < 4 ? undefined : args[0])
    .filter(x => x)
    .map(folder => path.join(folder, searchBaseSubFolder || ""));
  if (!searchBaseFolders.length) {
    searchBaseFolders = [programFilesFolder];
  }
  [searchFolderPrefix, searchBin, options] = args.slice(args.length - 3);
  const ignoreBetas = options.ignoreBetas === undefined ? true : options.ignoreBetas;

  const lprefix = searchFolderPrefix.toLowerCase();
  const runner = searchBaseFolders
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
    throw "Can't find any installed " + name;
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

function searchForNunit(options) {
  options = options || {};
  var isX86 = (options.x86 || ((options.platform || options.architecture) === "x86"));
  var runner = isX86 ? "/bin/nunit-console-x86.exe" : "/bin/nunit-console.exe";
  return findWrapper(function () {
    return findInstalledNUnit3() || finder("NUnit", runner, options);
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
