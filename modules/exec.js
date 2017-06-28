// MUST use for running batch files
// you can use this for other commands but spawn is better
// as it handles IO better
const 
  log = require("./log"),
  child_process = require("child_process"),
  debug = require("debug")("exec");

var defaultOptions = {
  cwd: process.cwd(),
  shell: true
};

var doExecFile = function (cmd, args, opts) {
  // TODO: implement handlers for stdout, stderr
  return new Promise((resolve, reject) => {
    try {
      child_process.execFile(cmd, args, opts, function (error, stdout, stderr) {
        if (error) {
          return reject({
            error: error,
            stderr: stderr,
            stdout: stdout
          });
        }
        resolve(stdout);
      });
    } catch (e) {
      reject(e);
    }
  });
};

var trim = function (data) {
  return ("" + (data || "")).trim();
};

var isWarning = function (str) {
  return str.indexOf(" WARN ") > -1;
};

var isError = function (str) {
  return str.indexOf(" ERROR ") > -1;
};

var printLines = function (data) {
  var lines = trim(data).split("\n");
  lines.forEach(function (line) {
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

var doSpawn = function (cmd, args, opts, handlers) {
  handlers = handlers || {};
  return new Promise((resolve, reject) => {
    try {
      var cmdArgs = ["/c", cmd];
      cmdArgs.push.apply(cmdArgs, args);
      log.suppressTimeStamps();
      var proc = child_process.spawn("cmd.exe", cmdArgs, opts);
      var stdoutHandler = handlers.stdout || printLines;
      if (proc.stdout) {
        proc.stdout.on("data", function (data) {
          stdoutHandler(data);
        });
      }
      if (proc.stderr) {
        proc.stderr.on("data", function (data) {
          log.error(trim(data));
        });
      }
      proc.on("close", function (code) {
        log.showTimeStamps();
        if (code) {
          reject({ error: new Error("Exit code " + code) });
        } else {
          resolve();
        }
      });
      proc.on("error", function (err) {
        log.showTimeStamps();
        log.error("failed to start process");
        log.error(err);
        reject({ error: err });
      });
    } catch (e) {
      reject(e);
    }
  });
};

var doExec = function (cmd, args, opts, handlers) {
  return (opts._useExecFile) ? doExecFile(cmd, args, opts, handlers) : doSpawn(cmd, args, opts, handlers);
};

var exec = function (cmd, args, opts, handlers) {
  args = args || [];
  opts = Object.assign({}, defaultOptions, opts);
  opts.maxBuffer = Number.MAX_SAFE_INTEGER;
  debug("executing:")
  debug(`- cmd: ${cmd}`);
  debug(`- args: ${JSON.stringify(args)}`);
  debug(`- opts: ${JSON.stringify(opts)}`);
  debug(`- handlers: ${JSON.stringify(handlers)}`);
  return doExec(cmd, args, opts, handlers || {});
};

module.exports = exec;
