// use for spawning actual processes.
// You must use exec if you want to run batch files
var
  q = require('q'),
  debug = require('debug')('spawn'),
  child_process = require('child_process'),
  debug = require('debug')('spawn-wrapper');

var defaultOptions = {
  stdio: [process.stdin, process.stdout, process.stderr, 'pipe'],
  cwd: process.cwd()
};

var run = function (executable, args, opts) {
  args = args || [];
  opts = Object.assign({}, defaultOptions, opts);
  var deferred = q.defer();
  var result = {
    executable: executable,
    args: args
  };

  debug(`spawning: "${executable}" ${args.map(a => '"' + a + '"').join(' ')}`);

  var child = child_process.spawn(executable, args, opts);
  child.on('error', function (err) {
    debug('child error');
    result.error = err;
    deferred.reject(result);
  })
  child.on('close', function (code) {
    debug(`child exits: ${code}`);
    result.exitCode = code;
    if (code === 0) {
      deferred.resolve(result);
    } else {
      deferred.reject(result);
    }
  });
  return deferred.promise;
}

module.exports = run;
