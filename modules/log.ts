import { StyleFunction } from "ansi-colors";

(function () {
  // TODO: apply some TS faerie dust
  const gutil = requireModule<GulpUtil>("gulp-util"),
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
    } as Dictionary<number>;
  class LogLevels {
    get Debug(): number {
      return DEBUG;
    }
    get Info(): number {
      return INFO;
    }
    get Notice(): number {
      return NOTICE;
    }
    get Warning(): number {
      return WARNING;
    }
    get Error(): number {
      return ERROR;
    }
  }

  class Logger {
      public get LogLevels(): LogLevels {
          return this._logLevels;
      }
      private _logLevels = new LogLevels();
      private _threshold: number = INFO;
      private _timestamp: boolean = true;

    constructor() {
        const logLevel = (process.env.LOG_LEVEL || "").toUpperCase();
        this.setThreshold(levels[logLevel] || INFO);
    }

    get threshold() {
      return this._threshold;
    }

    setThreshold(value: string | number) {
      if (levels[value] !== undefined) {
        value = levels[value];
      }
      const intValue = parseInt(`${value}`);
      if (isNaN(intValue) || intValue < 1 || intValue > 5) {
        throw value +
        " is not a valid integer value. Try use one of (logger).LogLevels.{Debug|Info|Notice|Warning|Error}";
      }
      this._threshold = intValue;
    }

    debug(...args: any[]) {
      if (this._threshold > DEBUG) {
          return;
      }
      this._print(args, "grey");
    }
    info(...args: any[]) {
      if (this._threshold >= INFO) {
          return;
      }
      this._print(args, "yellow");
    }
    warning(...args: any[]) {
        // just in case someone is still using this
        this.warn(...args);
    }
    warn(...args: any[]) {
      if (this._threshold >= WARNING) {
          return;
      }
      this._print(args, "magenta");
    }
    error(...args: any[]) {
      this._print(args, "red", "bold");
    }
    fail(...args: any[]) {
      this.error(args);
    }
    ok(...args: any[]) {
      this._print(args, "green");
    }
    notice(...args: any[]) {
      if (this._threshold > NOTICE) {
          return;
      }
      this._print(args, "cyan");
    }
    suppressTimeStamps() {
      this._timestamp = false;
    }
    showTimeStamps() {
      this._timestamp = true;
    }
    _print(args: any[], ...styles: (keyof(StyleFunction))[]) {
      let message: string;
      if (typeof args[0] === "string") {
          message = args[0];
      } else {
          if (args[0]) {
              message = args[0].toString();
          } else {
              message = "";
          }
      }
      const styleFunction = styles.reduce(
        function (acc: ((s: string) => string), cur) {
          const fn = gutil.colors[cur];
          if (fn === undefined) {
            return acc;
          }
          return function (s: string) {
            return fn(acc(s));
          };
        },
        function (s: string) {
          return s;
        }
      );
      if (this._timestamp) {
        gutil.log(styleFunction(message), ...args.slice(1));
      } else {
        console.log(styleFunction(message), ...args.slice(1));
      }
    }
  }
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
