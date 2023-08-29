"use strict";
(function () {
    const _which_ = require("which");
    module.exports = function which(executable) {
        try {
            return _which_.sync(executable);
        }
        catch (e) {
            return undefined;
        }
    };
})();
