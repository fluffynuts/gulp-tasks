"use strict";
(function () {
    module.exports = function fallback(...args) {
        return args.reduce((acc, cur) => {
            return acc === undefined ? cur : acc;
        });
    };
})();
