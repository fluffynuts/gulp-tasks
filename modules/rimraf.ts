export interface RimrafOptions {
  maxBusyTries?: number;
  emfileWait?: number;
  disableGlob?: boolean;
}
(function() {
  const _rimraf = require("rimraf");

  module.exports = function rimraf(at: string, opts?: RimrafOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (opts) {
        // the rimraf module doesn't test if options are undefined
        // -> it tests if options is a function and shifts args :/
        _rimraf(
          at,
          opts,
          (err: Error) => err
            ? reject(err)
            : resolve()
        );
      } else {
        _rimraf(
          at,
          (err: Error) => err
            ? reject(err)
            : resolve()
        );
      }
    });
  }
})();
