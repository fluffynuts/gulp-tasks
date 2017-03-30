// use for spawning actual processes.
// You must use exec if you want to run batch files
var
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
  return new Promise((resolve, reject) => {
    try {
      var result = {
        executable: executable,
        args: args
      };

      debug(`spawning: "${executable}" ${args.map(a => '"' + a + '"').join(' ')}`);

      var child = child_process.spawn(executable, args, opts);
      child.on('error', function (err) {
        debug('child error');
        result.error = err;
        reject(result);
      })
      child.on('close', function (code) {
        debug(`child exits: ${code}`);
        result.exitCode = code;
        if (code === 0) {
          resolve(result);
        } else {
          reject(result);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = run;
