// use for spawning actual processes.
// You must use exec if you want to run batch files
var
  tryLoadDebug = function() {
    try {
      return require("debug")("spawn");
    } catch (e) {
      return function() { };
    }
  },
  quoteIfRequired = require("./quote-if-required"),
  debug = tryLoadDebug(),
  child_process = require('child_process');

var defaultOptions = {
  stdio: [process.stdin, process.stdout, process.stderr],
  cwd: process.cwd(),
  shell: true
};

function spawn (executable, args, opts) {
  args = args || [];
  opts = Object.assign({}, defaultOptions, opts);

  var stdOutWriter = null, stdErrWriter = null;
  if (typeof opts.stdout === "function") {
    stdOutWriter = opts.stdout;
    opts.stdio[1] = "pipe";
  }
  if (typeof opts.stderr === "function") {
    stdErrWriter = opts.stderr;
    opts.stdio[2] = "pipe";
  }

  var result = {
    executable: executable,
    args: args
  };

  debug(`spawning: ${quoteIfRequired(executable)} ${args.map(a => '"' + a + '"').join(' ')}`);
  debug({ opts });

  return new Promise((resolve, reject) => {
    var child = child_process.spawn(quoteIfRequired(executable), args, opts);
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
    if (stdOutWriter) {
      child.stdout.on("data", stdOutWriter);
    }
    if (stdErrWriter) {
      child.stderr.on("data", stdErrWriter);
    }
  });
};

module.exports = spawn;
