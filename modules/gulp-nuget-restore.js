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
var HttpDownloader = require('./http-downloader');

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

function completedFile(path) {
    return path + '.completed';
}

function wasCompletedWithinADay(completed, nuget) {
    var completedExists = fs.existsSync(completed);
    var nugetExists = fs.existsSync(nuget);
    if (!completedExists || !nugetExists) {
      if (completedExists) {
        fs.unlinkSync(completed);
      }
      if (nugetExists) {
        fs.unlinkSync(nuget);
      }
      return false;
    }
    try {
        var ms = Date.parse(fs.readFileSync(completed).toString());
        if (isNaN(ms)) {
            return false;
        }
        var completedAt = new Date(ms),
            completedDelta = (new Date()) - completedAt;
        return completedDelta < 86400000;   // one day. arb.
    } catch (ignore) {
        return false;
    }
}

function findLocalNuget() {
    var localNuget = path.join(__dirname, 'nuget.exe'),
        completed = completedFile(localNuget),
        url = 'http://dist.nuget.org/win-x86-commandline/latest/nuget.exe';
    var i = 1;
    return new Promise(function(resolve, reject) {
        if (wasCompletedWithinADay(completed, localNuget)) {
            return resolve(localNuget);
        }
        var lastCompleted = null;
        if (fs.existsSync(completed) && fs.existsSync(localNuget)) {
            lastCompleted = fs.readFileSync(completed);
            fs.unlinkSync(completed);
        }
        var downloader = new HttpDownloader();
        downloader.download(url, localNuget).then(function(dl) {
            fs.writeFileSync(completed, new Date());
            resolve(dl);
        }).catch(function(err) {
            if (lastCompleted) {
                fs.writeFileSync(completed, lastCompleted);
                log.info(err);
                log.info('Falling back on last local nuget.exe');
                return resolve(localNuget);
            }
            reject(err);
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
            findLocalNuget().then(function(nuget) {
                resolve(nuget);
            }).catch(function(err) {
                log.error(err);
                reject(err);
            });
        }
    });
}
 
function runNugetRestoreWith(stream, solutionFiles, options, retrying) {
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
    return checkIfNugetIsAvailable(nuget, stream).then(function(nuget) {
        var opts = {
            stdio: [process.stdin, process.stdout, process.stderr, 'pipe'],
            cwd: process.cwd()
        };

        var deferred = q.defer();
        var final = solutions.reduce(function(promise, item) {
            log.info('Restoring packages for: ' + item);
            var args = [ 'restore', item];
            return promise.then(function() {
              try {
                return spawn(nuget, args, opts).then(function() {
                    'Packages restored for: ' + item;
                }).catch(function(err) {
                  console.log(err);
                });
              } catch (e) {
                if (retrying) {
                  return fail(stream, e);
                }
                if (fs.existsSync(nuget) &&
                    path.dirname(nuget) === __dirname) {
                    try {
                      fs.unlinkSync(nuget)
                      runNugetRestoreWith(stream, solutionFiles, options, true).then(function() {
                        end(stream);
                      }).catch(function(e) {
                        fail(stream, e);
                      })
                    } catch (e) {
                      throw 'Unable to spawn nuget & unable to remove it to attempt re-download: ' + (e || 'UNKNOWN');
                    }
                }
              }
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
