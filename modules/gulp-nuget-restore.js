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
var http = require('http');

var PLUGIN_NAME = 'gulp-dotcover';
var DEBUG = true;

var CWD = process.cwd();
function projectPathFor(path) {
  return [CWD, path].join('/');
}

function nugetRestore(options) {
  options = options || { }
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

function handleNugetDownload(downloadSize, response, localNuget, resolve, reject) {
    var suffix = '% of ' + humanSize(downloadSize);
    response.on('end', function() {
        clearStatus();
        resolve(localNuget);
    });
    response.on('error', function(data) {
        reject([
            'download of "',
            url,
            '" failed.',
            '\n',
            data ? data.toString() : 'unknown error'
        ].join(''));
    });
    var written = 0, lastPerc = -1;
    response.on('data', function(data) {
        written += data.length;
        var perc = Math.round((100 * written) / downloadSize);
        if (perc !== lastPerc) {
            writeStatus(perc + suffix);
        }
        lastPerc = perc;
        fs.appendFileSync(localNuget, data);
    });
}

function attemptToDownloadNugetCLI() {
    var localNuget = path.join(__dirname, 'nuget.exe'),
        url = 'http://dist.nuget.org/win-x86-commandline/latest/nuget.exe';
    return new Promise(function(resolve, reject) {
        var request = http.get(url, function(response) {
            var downloadSize = parseInt(response.headers['content-length']);
            if (fs.existsSync(localNuget)) {
                var statInfo = fs.lstatSync(localNuget);
                if (statInfo.size === downloadSize) {
                    log.info('local nuget found at: ' + localNuget);
                    request.destroy();
                    return resolve(localNuget);
                }
                log.info('local nuget incomplete or out of date; re-downloading');
                fs.unlinkSync(localNuget);
            } else {
              log.info('Can\'t find nuget.exe in your path. Attempting to download a fresh copy now...');
            }
            handleNugetDownload(downloadSize, response, localNuget, resolve, reject);
        });
    });
}

function checkIfNugetIsAvailable(nugetPath, stream) {
    return new Promise(function(resolve, reject) {
        try {
            var nuget = which.sync('nuget');
            log.info('Using nuget.exe from: ' + nuget);
            resolve(nuget);
        } catch (ignore) {
            attemptToDownloadNugetCLI().then(function(nuget) {
                resolve(nuget);
            }).catch(function(err) {
                log.error(err);
                reject(err);
            });
        }
    });
}
 
function runNugetRestoreWith(stream, solutionFiles, options) {
    var ignored = 0;
    var solutions = solutionFiles.map(function(file) {
        return file.path.replace(/\\/g, '/');
    }).reduce(function(accumulator, item) {
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
    checkIfNugetIsAvailable(nuget, stream).then(function(nuget) {
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
    }).catch(function(err) {
        fail(stream, err);
    });
}

module.exports = nugetRestore;
