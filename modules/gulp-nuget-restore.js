'use strict';
var gutil = require('gulp-util');
var es = require('event-stream');
var fs = require('fs');
var q = require('q');
var spawn = require('./spawn');
var exec = require('./exec');
var log = require('./log');
var path = require('path');
var which = require('which');
var resolveNuget = require('./resolve-nuget');

var PLUGIN_NAME = 'gulp-dotcover';
var DEBUG = true;

var CWD = process.cwd();
function projectPathFor(path) {
  return [CWD, path].join('/');
}

function nugetRestore(options) {
  options = options || {}
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
};

function fail(stream, msg) {
  stream.emit('error', new gutil.PluginError(PLUGIN_NAME, msg));
}
function end(stream) {
  stream.emit('end');
}

function trim() {
  var args = Array.prototype.slice.call(arguments)
  var source = args[0];
  var replacements = args.slice(1).join(',');
  var regex = new RegExp("^[" + replacements + "]+|[" + replacements + "]+$", "g");
  return source.replace(regex, '');
}

function clearStatus() {
  process.stdout.write('\r                \r');
}

function writeStatus(str) {
  clearStatus();
  process.stdout.write(str);
}

function humanSize(size) {
  return (size / 1024 / 1024).toFixed(2) + 'mb';
}

function determineNugetCmd(nugetPath, stream) {
  try {
    var nuget = resolveNuget(nugetPath);
    log.info('Using nuget.exe from: ' + nuget);
    return nuget;
  } catch (ignore) {
    fail(stream, `No nuget.exe resolved: ${err}`);
  }
}

function runNuget(nugetCmd, solutions, stream) {
  var opts = {
    stdio: [process.stdin, process.stdout, process.stderr, 'pipe'],
    cwd: process.cwd()
  };

  var deferred = q.defer();
  var final = solutions.reduce(function (promise, item) {
    log.info('Restoring packages for: ' + item);
    var args = ['restore', item];
    return promise.then(function () {
      return spawn(nugetCmd, args, opts).then(function () {
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

function runNugetRestoreWith(stream, solutionFiles, options, retrying) {
  var ignored = 0;
  var solutions = solutionFiles.map(function (file) {
    return file.path.replace(/\\/g, '/');
  }).reduce(function (accumulator, item) {
    var solutionDir = path.dirname(item);
    accumulator.push(item);
    return accumulator;
  }, []);
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
