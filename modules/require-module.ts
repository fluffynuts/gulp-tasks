(function() {
    const
        path = require("path"),
        reportObsolete = require("./report-obsolete"),
        debug = require("debug")(path.basename(__filename.replace(/\.js$/, "")));

    const mocks = {} as Dictionary<any>;

    function requireModule<T>(mod?: string) {
        if (!mod) {
            throw new Error("No module file name specified");
        }
        if (mocks[mod] !== undefined) {
            debug(`returning mock for '${mod}'`, mocks[mod]);
            return mocks[mod] as T;
        } else {
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
        return result as T;
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
