// use for spawning actual processes.
// You must use exec if you want to run batch files
const tryLoadDebug = function () {
    try {
      return require("debug")("spawn");
    } catch (e) {
      return function () {
      };
    }
  },
  quoteIfRequired = require("./quote-if-required"),
  debug = tryLoadDebug(),
  child_process = require("child_process");

const defaultOptions = {
  stdio: [ process.stdin, process.stdout, process.stderr ],
  cwd: process.cwd(),
  shell: true
};

function spawn(executable, args, opts) {
  args = args || [];
  opts = Object.assign({}, defaultOptions, opts);

  let stdOutWriter = null,
    stdErrWriter = null;
  if (typeof opts.stdout === "function") {
    stdOutWriter = opts.stdout;
    opts.stdio[1] = "pipe";
  }
  if (typeof opts.stderr === "function") {
    stdErrWriter = opts.stderr;
    opts.stdio[2] = "pipe";
  }

  const result = {
    executable: executable,
    args: args
  };

  executable = quoteIfRequired(executable);

  console.log({
    label: "spawn",
    debug: process.env.DEBUG
  });

  debug(`spawning: ${executable} ${args.map(a => '"' + a + '"').join(" ")}`);
  debug({ opts });

  return new Promise((resolve, reject) => {
    try {
      const child = child_process.spawn(executable, args, opts);
      child.on("error", function(err) {
        debug(`child error: ${err}`);
        result.error = err;
        reject(`"${[executable].concat(args).join(" ")}" failed with "${err}"`);
      });
      child.on("close", function(code) {
        debug(`child exits: ${code}`);
        result.exitCode = code;
        if (code === 0) {
          resolve(result);
        } else {
          reject(
            `"${[executable]
              .concat(args)
              .join(" ")}" failed with exit code ${code}`
          );
        }
      });
      if (stdOutWriter) {
        child.stdout.on("data", stdOutWriter);
      }
      if (stdErrWriter) {
        child.stderr.on("data", stdErrWriter);
      }
    } catch (e) {
      reject(`Unable to spawn process: ${e}`);
    }
  });
}

module.exports = spawn;
