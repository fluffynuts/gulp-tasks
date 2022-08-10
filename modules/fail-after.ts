import Timeout = NodeJS.Timeout;

(function() {
  class Failer {
    public promise: Promise<void>;

    private _timer?: Timeout;
    private _cancelled = false;

    constructor(public ms: number, message?: string) {
      this.promise = new Promise<void>((_, reject) => {
        this._timer = setTimeout(() => {
          this._timer = undefined;
          message = message || "operation timed out";
          reject(new Error(message));
        }, ms);
      })
    }

    public cancel() {
      if (this._timer) {
        clearTimeout(this._timer);
        this._cancelled = true;
        this._timer = undefined;
      } else if (!this._cancelled) {
        // perhaps timer hasn't been set yet
        setImmediate(() => this.cancel());
      }
    }
  }
  module.exports = function failAfter(ms: number, message?: string) {
    return new Failer(ms, message);
  };
})();
