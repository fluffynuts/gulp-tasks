"use strict";
(async function () {
    const path = require("path"), { folderExistsSync } = require("yafs");
    if (global.fetch === undefined) {
        global.fetch = require("cross-fetch");
    }
    const imported = folderExistsSync(path.join(__dirname, "fetch-github-release", "dist"))
        ? require("./fetch-github-release/dist")
        : require("./fetch-github-release/src");
    module.exports = imported;
})();
