"use strict";
(function () {
    const os = require("os"), isWin32 = os.platform() === "win32";
    module.exports = function isWindows() {
        return isWin32;
    };
})();
