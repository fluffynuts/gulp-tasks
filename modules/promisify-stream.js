const
  debug = require("debug")("promisify-stream"),
  stream = require("stream"),
  { ZarroError } = requireModule("zarro-error"),
  promisifyFunction = require("./promisify-function");

function isStream(o) {
  return o instanceof stream.Stream;
}

function isPromise(o) {
  return o instanceof Promise;
}

function looksLikeStream(o) {
  return isFunction(o.on);
}

function looksLikePromise(o) {
  return isFunction(o.then);
}

function isFunction(o) {
  return typeof (o) === "function";
}

function passThrough(p) {
  return p;
}

function noop() {
}

function promisifyStream(s) {
  return new Promise((resolve, reject) => {
    var i = 1;

    function runResolve() {
      debug("promisified stream ends successfully - resolving promise");
      reject = noop;
      resolve.apply(null, Array.from(arguments));
    }

    function runReject() {
      debug("promisified stream errors - rejecting promise");
      resolve = noop;
      reject.apply(null, Array.from(arguments));
    }

    s.on("error", runReject);
    s.on("end", runResolve);
    s.on("finish", runResolve);
  });
}

const strategies = [
  [ isFunction, promisifyFunction ],
  [ isPromise, passThrough ],
  [ looksLikePromise, passThrough ],
  [ isStream, promisifyStream ],
  [ looksLikeStream, promisifyStream ]
];

module.exports = function (item) {
  const args = Array.from(arguments);
  const strategy = strategies.reduce((acc, cur) => {
    return acc || (cur[0](item) ? cur[1] : null);
  }, null);
  if (!strategy) {
    throw new ZarroError(`Unable to promisify ${item}: dunno what to do with it, squire!`);
  }
  return strategy.apply(null, args);
};
