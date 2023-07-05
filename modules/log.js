(function () {
  // TODO: apply some TS faerie dust
  const gutil = requireModule("gulp-util"),
    DEBUG = 1,
    INFO = 2,
    NOTICE = 3,
    WARNING = 4,
    ERROR = 5,
    levels = {
      DEBUG,
      INFO,
      NOTICE,
      WARNING
    };
  const LogLevels = function () {
  };
  LogLevels.prototype = {
    get Debug() {
      return DEBUG;
    },
    get Info() {
      return INFO;
    },
    get Notice() {
      return NOTICE;
    },
    get Warning() {
      return WARNING;
    },
    get Error() {
      return ERROR;
    }
  };
  const Logger = function () {
    this.LogLevels = new LogLevels();
    const logLevel = (process.env.LOG_LEVEL || "").toUpperCase();
    this.setThreshold(levels[logLevel] || INFO);
    this._timestamp = true;
  };
  Logger.prototype = {
    get threshold() {
      return this._threshold;
    },
    setThreshold: function (value) {
      if (levels[value] !== undefined) {
        value = levels[value];
      }
      const intValue = parseInt(value);
      if (isNaN(intValue) || intValue < 1 || intValue > 5) {
        throw value +
        " is not a valid integer value. Try use one of (logger).LogLevels.{Debug|Info|Notice|Warning|Error}";
      }
      this._threshold = intValue;
    },
    debug: function () {
      const message = this._resolve(Array.from(arguments));
      if (this._threshold >= DEBUG) return;
      this._print(message, "grey");
    },
    info: function () {
      const message = this._resolve(Array.from(arguments));
      if (this._threshold >= INFO) return;
      this._print(message, "yellow");
    },
    warning: function () {
      const message = this._resolve(Array.from(arguments));
      if (this._threshold >= WARNING) return;
      this._print(message, "magenta");
    },
    error: function () {
      const message = this._resolve(Array.from(arguments));
      this._print(message, "red", "bold");
    },
    fail: function () {
      const message = this._resolve(Array.from(arguments));
      this.error(message);
    },
    ok: function () {
      const message = this._resolve(Array.from(arguments));
      this._print(message, "green");
    },
    notice: function () {
      const message = this._resolve(Array.from(arguments));
      if (this._threshold > NOTICE) return;
      this._print(message, "cyan");
    },
    suppressTimeStamps: function () {
      this._timestamp = false;
    },
    showTimeStamps: function () {
      this._timestamp = true;
    },
    _resolve: function (args) {
      return args
        .map(a => {
          if (a === undefined) {
            return "(undefined)";
          }
          if (a === null) {
            return "(null)";
          }
          if (Array.isArray(a)) {
            return a.join(",");
          }
          if (typeof a === "object") {
            return JSON.stringify(a);
          }
          return a.toString();
        })
        .join(" ");
    },
    _print: function () {
      const message = arguments[0];
      const styles = [];
      for (let i = 1; i < arguments.length; i++) {
        styles.push(arguments[i]); // because arguments is an object, not an array...
      }
      const styleFunction = styles.reduce(
        function (acc, cur) {
          const fn = gutil.colors[cur];
          if (fn === undefined) {
            return acc;
          }
          return function (s) {
            return fn(acc(s));
          };
        },
        function (s) {
          return s;
        }
      );
      if (this._timestamp) {
        gutil.log(styleFunction(message));
      } else {
        console.log(styleFunction(message));
      }
    }
  };
  const logger = new Logger();
  if (logger.threshold === DEBUG) {
    logger.debug(" -- testing logger outputs -- ");
    logger.debug("debug message");
    logger.info("info message");
    logger.warning("warning message");
    logger.error("error message");
  }
  module.exports = logger;
})();
