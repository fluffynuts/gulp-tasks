var fs = require('fs'),
    path = require('path');

function isDir(p) {
  return fs.lstatSync(p).isDirectory();
}

function resolve(relPaths, under) {
  return relPaths.map(d => path.resolve(path.join(under, d)));
}

function pushAll(array, items) {
  Array.prototype.push.apply(array, items);
}

function findDirs(under, withName) {
  var result = [];
  var dirs = fs.readdirSync(under)
                .map(d => path.resolve(path.join(under, d)))
                .filter(isDir);
  var toAdd = dirs.filter(d => path.basename(d) === withName);
  var toCheck = dirs.filter(d => path.basename(d) !== withName);

  pushAll(result, toAdd);
  toCheck.forEach(d => {
    pushAll(result, findDirs(d, withName));
  });

  return result;
}

module.exports = findDirs;
