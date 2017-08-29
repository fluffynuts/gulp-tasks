const stream = require("stream");
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
  return typeof(o) === "function";
}

function promisifyFunction(fn) {
  return new Promise((resolve, reject) => {
    try {
      resolve(fn());
    } catch (e) {
      reject(e);
    }
  });
}

function passThrough(p) {
  return p;
}

function noop() { }

function promisifyStream(s) {
  return new Promise((resolve, reject) => {
    function runResolve() {
      reject = noop;
      resolve.apply(null, Array.from(arguments));
    }
    function runReject() {
      resolve = noop;
      reject.apply(null, Array.from(arguments));
    }
    s.on("error", runReject);
    s.on("finish", runResolve);
  });
}

const strategies = [
  [ isFunction, promisifyFunction ],
  [ isPromise, passThrough ],
  [ isStream, promisifyStream ],
  [ looksLikeStream, promisifyStream ]
];

module.exports = function(item) {
  const strategy = strategies.reduce((acc, cur) => {
    return acc || (cur[0](item) ? cur[1] : null);
  }, null);
  if (!strategy) {
    throw new Error(`Unable to promisify ${item}: dunno what to do with it, squire!`);
  }
  return strategy(item);
};
