var fs = require('fs'),
  path = require('path'),
  debug = require('debug')('ls-r');

function isDir(p) {
  return fs.lstatSync(p).isDirectory();
}

function push(arr, item) {
  arr.push(item);
  return arr;
}

module.exports = function ls_R(dir, ignores) {
  dir = path.resolve(dir);
  ignores = ignores || [];
  var current = fs.readdirSync(dir);
  return current.reduce(function(acc, cur) {
    var fullPath = path.join(dir, cur);
    var shouldIgnore = ignores.reduce(function(acc, cur) {
      return acc || cur.test(fullPath);
    }, false);
    if (shouldIgnore) {
      debug(`ignoring ${fullPath}`);
      return acc;
    }
    return isDir(fullPath) ? acc.concat(ls_R(fullPath, ignores)) : push(acc, fullPath);
  }, []);
}
