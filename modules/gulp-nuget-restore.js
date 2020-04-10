'use strict';
var
  path = require("path"),
  gutil = require('gulp-util'),
  es = require('event-stream'),
  q = require('q'),
  spawn = require('./spawn'),
  log = require('./log'),
  resolveNuget = require('./resolve-nuget'),
  env = requireModule("env"),
  isDotnetCore = env.resolveFlag("DOTNET_CORE"),
  nugetExe = isDotnetCore ? (process.platform === "win32" ? "dotnet.exe" : "dotnet") : "nuget.exe",
  debug = require('debug')('gulp-nuget-restore');

var PLUGIN_NAME = 'gulp-nuget-restore';
var DEBUG = true;

function nugetRestore(options) {
  options = options || {};
  DEBUG = options.debug || process.env.DEBUG === "*" || false;
  options.force = options.force || false;
  if (DEBUG) {
    log.setThreshold(log.LogLevels.Debug);
  }
  var solutionFiles = [];
  var stream = es.through(function write(file) {
    if (!file) {
      fail(stream, 'file may not be empty or undefined');
    }
    solutionFiles.push(file);
    this.emit('data', file);
  }, function end() {
    restoreNugetPackagesWith(this, solutionFiles, options);
  });
  return stream;
}

function fail(stream, msg) {
  stream.emit('error', new gutil.PluginError(PLUGIN_NAME, msg));
}
function end(stream) {
  stream.emit('end');
}

function determineRestoreCommandFor(nugetPath, stream) {
  try {
    var nuget = resolveNuget(nugetPath);
    debug('Resolved restore tool at: ' + nuget);
    return nuget;
  } catch (ex) {
    fail(stream, [
      `No restore tool (nuget / dotnet) resolved: ${ex}`,
      `stack: ${ex.stack || "no stack"}`
    ].join("\n"));
  }
}

function runNuget(restoreCommand, solutions, stream) {
  debug(`restoreCmd: ${restoreCommand}`);
  var deferred = q.defer();
  var final = solutions.reduce(function (promise, item) {
    log.info('Restoring packages for: ' + item);
    var pathParts = item.split(/[\\|\/]/g);
    var sln = pathParts[pathParts.length - 1];
    var slnFolder = pathParts.slice(0, pathParts.length - 1).join(path.sep);
    var args = ['restore', sln];
    if (env.resolveFlag("ENABLE_NUGET_PARALLEL_PROCESSING")) {
      log.warning("Processing restore in parallel. If you get strange build errors, unset ENABLE_NUGET_PARALLEL_PROCESSING");
    } else {
      if (isDotnetCore) {
        args.push("--disable-parallel");
      } else {
        args.push("-DisableParallelProcessing");
      }
    }
    return promise.then(function () {
      return spawn(restoreCommand, args, { cwd: slnFolder }).then(function () {
        'Packages restored for: ' + item;
      }).catch(function (err) {
        throw err;
      });
    });
  }, deferred.promise);
  final.then(function () {
    end(stream);
  }).catch(function (err) {
    fail(stream, err);
  });
  deferred.resolve();
  return deferred;
}

function restoreNugetPackagesWith(stream, solutionFiles, options) {
  var solutions = solutionFiles.map(file => file.path);
  if (solutions.length === 0) {
    if (solutionFiles.length == 0) {
      return fail(stream, 'No solutions defined for nuget restore');
    }
  }
  var nuget = options.nuget || nugetExe;
  var nugetCmd = determineRestoreCommandFor(nuget, stream);
  if (nugetCmd) {
    return runNuget(nugetCmd, solutions, stream);
  }
}

module.exports = nugetRestore;
