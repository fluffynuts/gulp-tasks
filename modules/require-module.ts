(function () {
  const
    path = require("path"),
    debug = require("debug")(path.basename(__filename.replace(/\.js$/, "")));

  const mocks = {} as Dictionary<any>;

  function requireModule<T>(mod: string) {
    if (mocks[mod] !== undefined) {
      return mocks[mod] as T;
    }
    const modulePath = path.join(__dirname, mod);
    debug({
      label: "attempt to require",
      mod,
      modulePath,
    });
    return require(modulePath) as T;
  }

  requireModule.mock = function mock(
    moduleName: string,
    impl: any
  ) {
    mocks[moduleName] = impl;
  };

  requireModule.resetMocks = function resetMocks() {
    Object.keys(mocks).forEach(k => mocks[k] = undefined);
  };

  module.exports = global.requireModule = requireModule;
})();
