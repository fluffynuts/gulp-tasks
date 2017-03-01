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

var defaultIgnores = [/node_modules/, /\.git/, /bower_components/];

function ls_R(dir, ignores) {
  dir = path.resolve(dir);
  if (!fs.existsSync(dir)) {
    return [];
  }
  ignores = ignores || defaultIgnores;
  var current = fs.readdirSync(dir);
  if (!current) {
    debug(`got nothing for ${dir}`);
    return [];
  }
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

ls_R.DEFAULT_IGNORES = defaultIgnores;

module.exports = ls_R;
