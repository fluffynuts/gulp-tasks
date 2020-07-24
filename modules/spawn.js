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
  stdio: [process.stdin, process.stdout, process.stderr],
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
  } else {
    opts.stdio[1] = "inherit";
  }
  if (typeof opts.stderr === "function") {
    stdErrWriter = opts.stderr;
    opts.stdio[2] = "pipe";
  } else {
    opts.stdio[2] = "inherit";
  }

  const result = {
    executable: executable,
    args: args
  };

  executable = quoteIfRequired(executable);

  debug(`spawning: ${ executable } ${ args.map(a => '"' + a + '"').join(" ") }`);
  debug({ opts });

  return new Promise((resolve, reject) => {
    try {
      const child = child_process.spawn(executable, args, opts);
      const stdout = [];
      const stderr = [];
      child.on("error", function (err) {
        debug(`child error: ${ err }`);
        const e = new Error(
          `"${ [executable].concat(args).join(" ") }" failed with "${ err }"`
        );
        e.exitCode = -1;
        e.stderr = stderr;
        e.stdout = stdout;
        reject(e);
      });
      child.on("close", function (code) {
        debug(`child exits: ${ code }`);
        result.exitCode = code;
        if (code === 0) {
          resolve(result);
        } else {
          const err = new Error(
            `"${ [executable]
              .concat(args)
              .join(" ") }" failed with exit code ${ code }`
          );
          err.exitCode = code;
          err.stdout = stdout;
          err.stderr = stderr;
          return reject(err);
        }
      });
      if (stdOutWriter) {
        child.stdout.on("data", data => {
          const str = data.toString();
          stdout.push(str);
          stdOutWriter(str);
        });
      }
      if (stdErrWriter) {
        child.stderr.on("data", data => {
          const str = data.toString();
          stderr.push(str);
          stdErrWriter(str);
        });
      }
    } catch (e) {
      reject(`Unable to spawn process: ${ e }`);
    }
  });
}

module.exports = spawn;
