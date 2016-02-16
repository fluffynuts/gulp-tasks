// MUST use for running batch files
// you can use this for other commands but spawn is better
// as it handles IO better
var q = require('q');
var log = require('./log');
var child_process = require('child_process');

var defaultOptions = {
    cwd: process.cwd(),
};

var doExecFile = function(cmd, args, opts) {
  var deferred = q.defer();
  child_process.execFile(cmd, args, opts, function(error, stdout, stderr) {
    if (error) {
      return deferred.reject({
        error: error,
        stderr: stderr,
        stdout: stdout
      });
    }
    deferred.resolve(stdout);
  });
  return deferred.promise;
};

var trim = function(data) {
  return ('' + (data || '')).trim();
};

var isWarning = function(str) {
  return str.indexOf(' WARN ') > -1;
};

var isError = function(str) {
  return str.indexOf(' ERROR ') > -1;
};

var printLines = function(data) {
  var lines = trim(data).split('\n');
  lines.forEach(function(line) {
    line = trim(line);
    if (isError(line)) {
      log.error(line);
    } else if (isWarning(line)) {
      log.warning(line);
    } else {
      log.info(line);
    }
  });
};

var doSpawn = function(cmd, args, opts) {
  var deferred = q.defer();
  var cmdArgs = ['/c', cmd];
  cmdArgs.push.apply(cmdArgs, args);
  log.suppressTimeStamps();
  var proc = child_process.spawn('cmd.exe', cmdArgs, opts);
  proc.stdout.on('data', function(data) {
    printLines(data);
  });
  proc.stderr.on('data', function(data) {
    log.error(trim(data));
  });
  proc.on('close', function(code) {
    log.showTimeStamps();
    if (code) {
      deferred.reject(code);
    } else {
      deferred.resolve();
    }
  });
  proc.on('error', function(err) {
    log.showTimeStamps();
    log.error('failed to start process');
    log.error(err);
    deferred.reject();
  });
  return deferred.promise;
};

var doExec = function(cmd, args, opts) {
  return (opts._useExecFile) ? doExecFile(cmd, args, opts) : doSpawn(cmd, args, opts);
};

var exec = function(cmd, args, opts) {
    var deferred = q.defer();
    args = args || [];
    opts = opts || defaultOptions;
    opts.maxBuffer = Number.MAX_SAFE_INTEGER;
    return doExec(cmd, args, opts);
};

module.exports = exec;
