var gutil = require('gulp-util');
var DEBUG = 1;
var INFO = 2;
var NOTICE = 3;
var WARNING = 4;
var ERROR = 5;
var LogLevels = function() {
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
var Logger = function() {
    this.LogLevels = new LogLevels();
    this.setThreshold(INFO);
    this._timestamp = true;
};
Logger.prototype = {
    setThreshold: function(value) {
        var intValue = parseInt(value);
        if (isNaN(intValue) || intValue < 1 || intValue > 5) {
            throw value + ' is not a valid integer value. Try use one of (logger).LogLevels.{Debug|Info|Notice|Warning|Error}';
        }
        this._threshold = intValue;
    },
    debug: function(message) {
        if (this._threshold > DEBUG)
            return;
        this._print(message, 'grey');
    },
    info: function(message) {
        if (this._threshold > INFO)
            return;
        this._print(message, 'yellow');
    },
    warning: function(message) {
        if (this._threshold > WARNING)
            return;
        this._print(message, 'magenta');
    },
    error: function(message) {
        this._print(message, 'red', 'bold');
    },
    fail: function(message) {
        this.error(message);
    },
    ok: function(message) {
        this._print(message, 'green');
    },
    notice: function(message) {
        if (this._threshold > NOTICE)
            return;
        this._print(message, 'cyan');
    },
    suppressTimeStamps: function() {
      this._timestamp = false;
    },
    showTimeStamps: function() {
      this._timestamp = true;
    },
    _print: function() {
        var message = arguments[0];
        var styles = [];
        for (var i = 1; i < arguments.length; i++) {
            styles.push(arguments[i]);  // because arguments is an object, not an array...
        }
        var styleFunction = styles.reduce(function(acc, cur) {
            var fn = gutil.colors[cur];
            if (fn === undefined) {
                return acc;
            }
            return function(s) {
                return fn(acc(s));
            };
        }, function(s) { return s; });
        if (this._timestamp) {
          gutil.log(styleFunction(message));
        } else {
          console.log(styleFunction(message));
        }
    }
};
var logger = new Logger();
module.exports = logger;
