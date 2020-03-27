const path = require("path");

const mocks = {};

function requireModule(mod) {
  if (mocks[mod] !== undefined) {
    return mocks[mod];
  }
  const modulePath = path.join(__dirname, mod);
  return require(modulePath);
}

requireModule.mock = function mock(moduleName, impl) {
  mocks[moduleName] = impl
};

requireModule.resetMocks = function resetMocks() {
  Object.keys(mocks).forEach(k => mocks[k] = undefined);
};

module.exports = global.requireModule = requireModule;
