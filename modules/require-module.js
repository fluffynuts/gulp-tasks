"use strict";
(function () {
    const path = require("path"), { lsSync, fileExistsSync } = require("yafs"), { chopExtension } = require("./path-utils"), reportObsolete = require("./report-obsolete"), debug = require("debug")(path.basename(__filename.replace(/\.js$/, "")));
    const mocks = {};
    let allModules = [];
    function listAllKnownModuleFiles() {
        if (allModules.length) {
            return allModules;
        }
        const files = lsSync(__dirname)
            .map(chopExtension);
        allModules.push(...files);
        return allModules;
    }
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
        let result;
        let modulePath = path.join(__dirname, mod);
        debugger;
        try {
            debug({
                label: "attempt to require",
                mod,
                modulePath,
            });
            result = require(modulePath);
        }
        catch (e) {
            debug({
                label: "attempt to fuzzy-match module",
                mod,
                in: __dirname
            });
            const err = e, contents = listAllKnownModuleFiles(), fuzzyMatch = contents.find((s) => isFuzzyMatch(s, mod));
            if (!fuzzyMatch) {
                throw e;
            }
            console.warn(`Request to load zarro module '${mod}'. Loading closest match '${fuzzyMatch}'\nstack trace:\n${err.stack || e}`);
            modulePath = path.join(__dirname, fuzzyMatch);
            result = require(modulePath);
        }
        reportObsolete(mod, result);
        return result;
    }
    function isFuzzyMatch(left, right) {
        const l = fuzzify(left), r = fuzzify(right);
        console.log({
            left,
            l,
            right,
            r
        });
        return l === r;
    }
    function fuzzify(str) {
        return (str || "")
            .replace(/[-_]/g, "")
            .toLowerCase();
    }
    requireModule.mock = function mock(moduleName, impl) {
        mocks[moduleName] = impl;
    };
    requireModule.resetMocks = function resetMocks() {
        Object.keys(mocks).forEach(k => mocks[k] = undefined);
    };
    module.exports = global.requireModule = requireModule;
})();
