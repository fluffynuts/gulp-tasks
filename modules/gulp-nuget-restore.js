'use strict';
var gutil = require('gulp-util');
var es = require('event-stream');
var fs = require('fs');
var q = require('q');
var testUtilFinder = require('./testutil-finder');
var spawn = require('./spawn');
var exec = require('./exec');
var log = require('./log');

var PLUGIN_NAME = 'gulp-dotcover';
var DEBUG = true;

var CWD = process.cwd();
function projectPathFor(path) {
  return [CWD, path].join('/');
}

function nugetRestore(options) {
  options = options || { }
  DEBUG = options.debug || false;
  
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

function checkIfNugetIsAvailable(nugetPath, stream) {
    var finder = process.platform == 'win32' ? 'where' : 'which';
    return exec(finder, [nugetPath]);
}

function runNugetRestoreWith(stream, solutionFiles, options) {
    var solutions = solutionFiles.map(function(file) {
        return file.path.replace(/\\/g, '/');
    });
    if (solutions.length === 0) {
        return fail(stream, 'No test assemblies defined');
    }
    var nuget = options.nuget || 'nuget.exe';
    checkIfNugetIsAvailable(nuget, stream).then(function() {
        var puts = function(str) {
            gutil.log(gutil.colors.yellow(str));
        };
        var opts = {
            stdio: [process.stdin, process.stdout, process.stderr, 'pipe'],
            cwd: process.cwd()
        };

        var deferred = q.defer();
        var final = solutions.reduce(function(promise, item) {
            log.info('Restoring packages for: ' + item);
            var args = [ 'restore', item];
            return promise.then(function() {
                return spawn(nuget, args, opts).then(function() {
                    'Packages restored for: ' + item;
                });
            });
        }, deferred.promise);
        final.then(function() {
            end(stream);
        }).catch(function(err) {
            fail(stream, err);
        });

        deferred.resolve();
    }).catch(function() {
    log.error('Can\'t find nuget.exe. Either make sure it\'s in your path or explicitly provide a path in your nuget restore task options with the option "nuget"');
    fail(stream, 'Can\'t restore packages: no nuget )\':');
    });
}

module.exports = nugetRestore;
