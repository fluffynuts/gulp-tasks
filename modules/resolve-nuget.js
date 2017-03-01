var fs = require('fs'),
  path = require('path'),
  which = require('which'),
  config = require('./config');

var nugetExe = 'nuget.exe';

function findNugetInPath() {
  try {
    var nuget = which.sync('nuget');
    log.info(`Using ${nugetExe} from: ${nuget}`);
    return nuget;
  } catch (ignored) {
    return null;
  }
}

function checkExists(nugetPath) {
  return fs.existsSync(nugetPath) ? nugetPath : null;
}

var parentOfTasksFolder = path.resolve(path.join(__dirname, '..', '..'));

function resolveNuget(nugetPath) {
  // search for nuget:
  //  - given path
  //  - tools/nuget.exe
  //  - nuget.exe
  //  - override-tasks/nuget.exe
  //  - local-tasks/nuget.exe
  var resolved = [
    checkExists(nugetPath),
    checkExists(path.join(parentOfTasksFolder, 'tools', nugetExe)),
    checkExists(path.join(parentOfTasksFolder, nugetExe)),
    checkExists(path.join(parentOfTasksFolder, 'override-tasks', nugetExe)),
    checkExists(path.join(parentOfTasksFolder, 'local-tasks', nugetExe)),
    findNugetInPath(),
    checkExists(config.localNuget)
  ].reduce(function (acc, cur) {
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

