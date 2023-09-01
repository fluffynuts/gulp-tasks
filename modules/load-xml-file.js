"use strict";
(function () {
    const { readTextFile, fileExists } = require("yafs"), ZarroError = requireModule("zarro-error"), parse = requireModule("./parse-xml-string");
    module.exports = async function (filePath) {
        if (!await fileExists(filePath)) {
            throw new ZarroError(`File not found: ${filePath}`);
        }
        const data = await readTextFile(filePath);
        return parse(data);
    };
})();
