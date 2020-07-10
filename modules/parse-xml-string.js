"use strict";
(function () {
    const xml2js = require("xml2js"), promisify = requireModule("promisify-function");
    module.exports = promisify(xml2js.parseString, xml2js);
})();
