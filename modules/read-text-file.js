"use strict";
(function () {
    const makeObsolete = requireModule("make-obsolete");
    const { readTextFile } = require("yafs");
    module.exports = makeObsolete(readTextFile, {
        reason: "rather use readTextFile from 'yafs' (already installed)",
        expires: "2024-01-01"
    });
})();
