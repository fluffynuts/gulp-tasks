"use strict";
(function () {
    const { folderExists, readTextFile, fileExists } = require("yafs"), ZarroError = requireModule("zarro-error"), path = require("path");
    module.exports = async function readPackageJson(at) {
        if (at) {
            if (await folderExists(at)) {
                at = path.join(at, "package.json");
            }
            if (!(await fileExists(at))) {
                throw new ZarroError(`File not found: ${at}`);
            }
        }
        const pkgFile = path.join(at !== null && at !== void 0 ? at : "package.json"), text = await readTextFile(pkgFile);
        return JSON.parse(text);
    };
})();
