"use strict";
(function () {
    const path = require("path"), reportObsolete = require("./report-obsolete"), debug = require("debug")(path.basename(__filename.replace(/\.js$/, "")));
    const mocks = {};
    function requireModule(mod) {
        if (!mod) {
            throw new Error("No module file name specified");
        }
        if (mocks[mod] !== undefined) {
            debug(`returning mock for '${mod}'`, mocks[mod]);
            return mocks[mod];
        }
        else {
            debug(`loading up the real module '${mod}'`);
        }
        const modulePath = path.join(__dirname, mod);
        debug({
            label: "attempt to require",
            mod,
            modulePath,
        });
        const result = require(modulePath);
        reportObsolete(mod, result);
        return result;
    }
    requireModule.mock = function mock(moduleName, impl) {
        mocks[moduleName] = impl;
    };
    requireModule.resetMocks = function resetMocks() {
        Object.keys(mocks).forEach(k => mocks[k] = undefined);
    };
    module.exports = global.requireModule = requireModule;
})();
