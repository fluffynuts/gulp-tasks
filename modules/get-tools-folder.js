"use strict";
(function () {
    let env;
    const debug = require("debug")("get-tools-folder");
    function getToolsFolder(overrideEnv) {
        if (!overrideEnv) {
            env = env || require("./env");
        }
        const result = (overrideEnv || env).resolve("BUILD_TOOLS_FOLDER");
        debug("-> getting tools from: ", result);
        return result;
    }
    module.exports = getToolsFolder;
})();
