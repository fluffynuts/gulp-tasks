"use strict";
(function () {
    const fs = require("fs"), { mkdir, mkdirSync } = require("yafs"), debug = require("debug")("ensure-folder-exists");
    async function ensureFolderExists(folder) {
        debug(`Ensuring existence of folder "${folder}"`);
        await mkdir(folder);
    }
    function ensureFolderExistsSync(folder) {
        mkdirSync(folder);
    }
    ensureFolderExists.sync = ensureFolderExistsSync;
    module.exports = ensureFolderExists;
})();
