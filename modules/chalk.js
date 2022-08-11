"use strict";
(function () {
    const env = requireModule("env"), actual = require("ansi-colors"), shim = {}, functions = Object.keys(actual)
        .filter(k => typeof actual[k] === "function");
    for (const fn of functions) {
        shim[fn] = (s) => {
            if (env.resolveFlag("NO_COLOR")) {
                return s;
            }
            return actual[fn](s);
        };
    }
    module.exports = shim;
})();
