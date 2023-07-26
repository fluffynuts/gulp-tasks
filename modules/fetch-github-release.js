"use strict";
(async function () {
    debugger;
    const path = require("path"), { folderExistsSync } = require("yafs");
    const imported = folderExistsSync(path.join(__dirname, "fetch-github-release", "dist"))
        ? require("./fetch-github-release/dist")
        : require("./fetch-github-release/src");
    debugger;
    module.exports = imported;
})();
