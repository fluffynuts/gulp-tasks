"use strict";
(function () {
    const { mkdir, mkdirSync } = require("yafs"), debug = requireModule("debug")(__filename);
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
