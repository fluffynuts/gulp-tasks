'use strict';
var gutil = require('gulp-util'),
  es = require('event-stream'),
  q = require('q'),
  spawn = require('./spawn'),
  log = require('./log'),
  resolveNuget = require('./resolve-nuget'),
  debug = require('debug')('gulp-nuget-restore');

var PLUGIN_NAME = 'gulp-nuget-restore';
var DEBUG = true;

function nugetRestore(options) {
  options = options || {};
  DEBUG = options.debug || false;
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
    runNugetRestoreWith(this, solutionFiles, options);
  });
  return stream;
}

function fail(stream, msg) {
  stream.emit('error', new gutil.PluginError(PLUGIN_NAME, msg));
}
function end(stream) {
  stream.emit('end');
}

function determineNugetCmd(nugetPath, stream) {
  try {
    var nuget = resolveNuget(nugetPath);
    log.info('Using nuget.exe from: ' + nuget);
    return nuget;
  } catch (ignore) {
    fail(stream, `No nuget.exe resolved: ${ignore}`);
  }
}

function runNuget(nugetCmd, solutions, stream) {
  debug(`nugetCmd: ${nugetCmd}`);
  var deferred = q.defer();
  var final = solutions.reduce(function (promise, item) {
    log.info('Restoring packages for: ' + item);
    var args = ['restore', `"${item.replace(/"/g, '""')}"`];
    return promise.then(function () {
      return spawn(nugetCmd, args).then(function () {
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

function runNugetRestoreWith(stream, solutionFiles, options) {
  var solutions = solutionFiles.map(file => file.path);
  if (solutions.length === 0) {
    if (solutionFiles.length == 0) {
      return fail(stream, 'No solutions defined for nuget restore');
    }
  }
  var nuget = options.nuget || 'nuget.exe';
  var nugetCmd = determineNugetCmd(nuget, stream);
  if (nugetCmd) {
    return runNuget(nugetCmd, solutions, stream);
  }
}

module.exports = nugetRestore;
