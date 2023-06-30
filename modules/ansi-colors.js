"use strict";
(function () {
    const ansiColors = require("ansi-colors");
    for (const k of Object.keys(ansiColors)) {
        const original = ansiColors[k];
        if (typeof original !== "function") {
            Object.defineProperty(module.exports, k, {
                get() {
                    return ansiColors[k];
                },
                set(v) {
                    ansiColors[k] = v;
                }
            });
            continue;
        }
        module.exports[k] = (s) => {
            return isSuppressed()
                ? s
                : ansiColors[k](s);
        };
    }
    function isSuppressed() {
        if (flag(process.env.FORCE_COLOR)) {
            return false;
        }
        return flag(process.env.NO_COLOR) || !process.stdout.isTTY;
    }
    const truthy = new Set([1, true, "1"]);
    function flag(value) {
        return truthy.has(value);
    }
})();
