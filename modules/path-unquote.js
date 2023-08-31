"use strict";
(function () {
    module.exports = function (str) {
        if (!str) {
            return str;
        }
        return str.replace(/^"/, "").replace(/"$/, "");
    };
})();
