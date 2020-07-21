"use strict";
(function () {
    class Failer {
        constructor(ms, message) {
            this.ms = ms;
            this._cancelled = false;
            this.promise = new Promise((_, reject) => {
                this._timer = setTimeout(() => {
                    this._timer = undefined;
                    message = message || "operation timed out";
                    reject(new Error(message));
                }, ms);
            });
        }
        cancel() {
            if (this._timer) {
                clearTimeout(this._timer);
                this._cancelled = true;
                this._timer = undefined;
            }
            else if (!this._cancelled) {
                // perhaps timer hasn't been set yet
                setImmediate(() => this.cancel());
            }
        }
    }
    module.exports = function failAfter(ms, message) {
        return new Failer(ms, message);
    };
})();
