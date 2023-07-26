"use strict";
(async function () {
    requireModule("fetch");
    const path = require("path"), { folderExistsSync } = require("yafs");
    const imported = folderExistsSync(path.join(__dirname, "fetch-github-release", "dist"))
        ? require("./fetch-github-release/dist")
        : require("./fetch-github-release/src");
    module.exports = imported;
})();
