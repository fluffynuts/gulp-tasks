// use for spawning actual processes.
// You must use exec if you want to run batch files
var
  debug = require('debug')('spawn'),
  child_process = require('child_process');

var defaultOptions = {
  stdio: [process.stdin, process.stdout, process.stderr, 'pipe'],
  cwd: process.cwd(),
  shell: true
};

var run = function (executable, args, opts) {
  args = args || [];
  opts = Object.assign({}, defaultOptions, opts);
  var result = {
    executable: executable,
    args: args
  };

  debug(`spawning: "${executable}" ${args.map(a => '"' + a + '"').join(' ')}`);

  return new Promise((resolve, reject) => {
    var child = child_process.spawn(`"${executable}"`, args, opts);
    child.on('error', function (err) {
      debug(`child error: ${err}`);
      result.error = err;
      reject(`"${[executable].concat(args).join(' ')}" failed with "${err}"`);
    });
    child.on('close', function (code) {
      debug(`child exits: ${code}`);
      result.exitCode = code;
      if (code === 0) {
        resolve(result);
      } else {
        reject(`"${[executable].concat(args).join(' ')}" failed with exit code ${code}`);
      }
    });
  });
};

module.exports = run;
