"use strict";
(function () {
    const pad = requireModule("pad");
    module.exports = function padRight(str, len, padString) {
        return pad(str, len, true, padString);
    };
})();
