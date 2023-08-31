"use strict";
(function () {
    module.exports = function defaults(config, fallback) {
        const result = Object.assign({}, config);
        Object.keys(fallback || {}).forEach(k => {
            if (result[k] === undefined) {
                result[k] = fallback[k];
            }
        });
        return result;
    };
})();
