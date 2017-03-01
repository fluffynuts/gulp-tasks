'use strict';
var
  log = require('./log'),
  fs = require('fs'),
  path = require('path'),
  debug = require('debug')('testutil-finder'),
  lsR = require('./ls-r'),
  programFilesFolder = 'C:/Program Files (x86)';

function isUnstable(folderName) {
  return folderName.indexOf('alpha') > -1 ||
    folderName.indexOf('beta') > -1;
};

function finder(searchFolder, searchBin, options, searchBaseFolder) {
  searchBaseFolder = searchBaseFolder || programFilesFolder;
  var ignoreBetas = options.ignoreBetas === undefined ? true : options.ignoreBetas;

  var programFolders = fs.readdirSync(searchBaseFolder);
  var lsearch = searchFolder.toLowerCase();
  var possibles = programFolders.reduce(function (acc, cur) {
    var lcur = cur.toLowerCase();
    if (lcur.indexOf(lsearch) === 0) {
      if (ignoreBetas && isUnstable(lcur)) {
        log.notice('Ingnoring unstable tool at: ' + cur);
        return acc;
      }
      acc.push(cur);
    }
    return acc;
  }, []);
  if (possibles.length === 0) {
    throw 'no possibles';
  }
  possibles.sort();
  for (var i = possibles.length - 1; i > -1; i--) {
    var runner = [searchBaseFolder, '/', possibles[i], searchBin].join('');
    if (fs.existsSync(runner)) {
      log.debug('Using ' + runner);
      return runner;
    }
  }
  throw 'not found';
}

function findWrapper(func, name) {
  try {
    return func();
  } catch (e) {
    switch (e) {
      case 'no possibles':
        throw 'Can\'t find any installed ' + name;
      case 'not found':
        throw 'Found ' + name + ' folder but no binaries to run )\':';
      default:
        throw e;
    }
  }
}

var findInstalledNUnit3 = function () {
  var search = [programFilesFolder, 'NUnit.org', 'nunit-console', 'nunit3-console.exe'].join('/');
  return fs.existsSync(search) ? search : null;
};

function findNunitFromEnvironment() {
  if (process.env.NUNIT) {
    var result = checkExists(process.env.NUNIT);
    if (!result) {
      throw new Error('nunit specified by NUNIT environment variable not found at: ' + result);
    }
    return result;
  }
}

function findSolutionToolsNUnit3() {
  var baseDir = path.resolve(path.join('..', '..', __dirname));
  return lsR('tools').filter(function(p) {
    return p.toLowerCase().endsWith('nunit3-console.exe');
  })[0];

}

function checkExists(somePath) {
  return fs.existsSync(somePath) ? somePath: undefined;
}

function tryToFindNUnit(options) {
  var environmental = findNunitFromEnvironment();
  if (environmental) {
    return environmental;
  }
  var toolsNunit = findSolutionToolsNUnit3();
  if (toolsNunit) {
    return toolsNunit;
  }
  return searchForNunit(options);
}

function latestNUnit(options) {
  var result = tryToFindNUnit(options);
  debug(`Using nunit runner: ${result || 'NOT FOUND'}`);
  return result;
};

function searchForNunit(options) {
  options = options || {};
  var isX86 = (options.x86 || ((options.platform || options.architecture) === 'x86'));
  var runner = isX86 ? '/bin/nunit-console-x86.exe' : '/bin/nunit-console.exe';
  return findWrapper(function () {
    return findInstalledNUnit3() || finder('NUnit', runner, options);
  }, 'nunit-console runner');
}

function latestDotCover(options) {
  if (process.env.DOTCOVER) {
    var result = process.env.DOTCOVER;
    if (!fs.existsSync(result)) {
      throw new Error('dotCover specified by DOTCOVER environment variable not found at: ' + result);
    }
    return result;
  }
  options = options || {};
  return findWrapper(function () {
    return finder('v', '/bin/dotCover.exe', options, programFilesFolder + '/JetBrains/dotCover', 'dotCover');
  });
}
module.exports = {
  latestNUnit: latestNUnit,
  latestDotCover: latestDotCover
};
