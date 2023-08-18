"use strict";
(function () {
    const env = requireModule("env");
    function isPureMask(str) {
        return str && str[0] === "{" && str[str.length - 1] === "}";
    }
    function extractPureMask(str) {
        return str.substr(1, str.length - 2);
    }
    function makeRecursive(mask) {
        if (mask.indexOf(".") === 0) {
            // relative path
            return mask;
        }
        return mask.indexOf("**") === 0 ? mask : `**/${mask}`;
    }
    function passThrough(s) {
        return s;
    }
    module.exports = function resolveMasks(includeVar, excludeVar, maskModifierFn) {
        const transform = maskModifierFn === undefined
            ? passThrough
            : maskModifierFn;
        return env
            .resolveMergedArray(includeVar)
            .filter(p => !!p)
            .map(p => (isPureMask(p) ? extractPureMask(p) : makeRecursive(p)))
            .concat(env.resolveMergedArray(excludeVar).map(p => {
            if (isPureMask(p)) {
                // have path spec, don't do magic!
                return extractPureMask(p);
            }
            if (p.indexOf("!") === 0) {
                p = p.substring(1);
            }
            return `!${makeRecursive(p)}`;
        }))
            .map(p => transform(p));
    };
})();
