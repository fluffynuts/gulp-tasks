var fs = require('fs'),
  path = require('path'),
  which = require('which'),
  config = require('./config');

function findNugetInPath() {
  try {
    var nuget = which.sync('nuget');
    log.info('Using nuget.exe from: ' + nuget);
    return nuget;
  } catch (ignored) {
    return null;
  }
}

function checkExists(nugetPath) {
  return fs.existsSync(nugetPath) ? nugetPath: null;
}

var parentOfTasksFolder = path.resolve(path.join(__dirname, '..', '..'));

function resolveNuget(nugetPath) {
  var resolved = [
    checkExists(nugetPath),
    checkExists(path.join(parentOfTasksFolder, 'nuget.exe')),
    checkExists(path.join(parentOfTasksFolder, 'override-tasks', 'nuget.exe')),
    findNugetInPath(),
    checkExists(config.localNuget)
  ].reduce(function(acc, cur) {
    return acc || cur
  }, null);
  if (resolved) {
    return resolved;
  }
  if (nugetPath) {
    throw `configured nuget: "${nugetPath}" not found`;
  }
  throw `${config.localNuget} not found! Suggestion: add 'get-local-nuget' to your pipeline`;
}


module.exports = resolveNuget;

