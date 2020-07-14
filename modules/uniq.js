"use strict";
(function () {
    module.exports = function uniq(values) {
        return Array.from(new Set(values));
    };
})();
