"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    // TODO: apply some TS faerie dust
    const gutil = requireModule("gulp-util"), DEBUG = 1, INFO = 2, NOTICE = 3, WARNING = 4, ERROR = 5, levels = {
        DEBUG,
        INFO,
        NOTICE,
        WARNING
    };
    class LogLevels {
        get Debug() {
            return DEBUG;
        }
        get Info() {
            return INFO;
        }
        get Notice() {
            return NOTICE;
        }
        get Warning() {
            return WARNING;
        }
        get Error() {
            return ERROR;
        }
    }
    class Logger {
        get LogLevels() {
            return this._logLevels;
        }
        constructor() {
            this._logLevels = new LogLevels();
            this._threshold = INFO;
            this._timestamp = true;
            const logLevel = (process.env.LOG_LEVEL || "").toUpperCase();
            this.setThreshold(levels[logLevel] || INFO);
        }
        get threshold() {
            return this._threshold;
        }
        setThreshold(value) {
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
        debug(...args) {
            if (this._threshold > DEBUG) {
                return;
            }
            this._print(args, "grey");
        }
        info(...args) {
            if (this._threshold >= INFO) {
                return;
            }
            this._print(args, "yellow");
        }
        warning(...args) {
            // just in case someone is still using this
            this.warn(...args);
        }
        warn(...args) {
            if (this._threshold >= WARNING) {
                return;
            }
            this._print(args, "magenta");
        }
        error(...args) {
            this._print(args, "red", "bold");
        }
        fail(...args) {
            this.error(args);
        }
        ok(...args) {
            this._print(args, "green");
        }
        notice(...args) {
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
        _print(args, ...styles) {
            let message;
            if (typeof args[0] === "string") {
                message = args[0];
            }
            else {
                if (args[0]) {
                    message = args[0].toString();
                }
                else {
                    message = "";
                }
            }
            const styleFunction = styles.reduce(function (acc, cur) {
                const fn = gutil.colors[cur];
                if (fn === undefined) {
                    return acc;
                }
                return function (s) {
                    return fn(acc(s));
                };
            }, function (s) {
                return s;
            });
            if (this._timestamp) {
                gutil.log(styleFunction(message), ...args.slice(1));
            }
            else {
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
