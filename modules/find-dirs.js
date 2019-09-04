var fs = require("fs"),
  path = require("path"),
  multiSplit = require("./multi-split");

function isDir(p) {
  return fs.existsSync(p) && fs.lstatSync(p).isDirectory();
}

function pushAll(array, items) {
  Array.prototype.push.apply(array, items);
}

const cache = {};

function findDirs(under, withName, neverTraverse) {
  var result = [];
  neverTraverse = neverTraverse || [];

  var start = cache[under] || (cache[under] = fs.readdirSync(under));
  var dirs = start.map(d => path.resolve(path.join(under, d))).filter(isDir);
  var toAdd = dirs.filter(d => path.basename(d) === withName);
  var toCheck = dirs
    .filter(d => path.basename(d) !== withName)
    .filter(d => {
      const
        parts = multiSplit(d, [ "/", "\\" ]),
        include = neverTraverse.indexOf(parts[parts.length-1]) === -1;
      return include;
    });

  pushAll(result, toAdd);
  toCheck.forEach(d => {
    result.push.apply(result, findDirs(d, withName, neverTraverse));
  });

  return result;
}

module.exports = findDirs;
