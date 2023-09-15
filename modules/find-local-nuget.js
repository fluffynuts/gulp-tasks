"use strict";
(function () {
    const path = require("path"), log = requireModule("log"), { fileExists, writeTextFile, chmod } = require("yafs"), resolveNuget = requireModule("resolve-nuget"), shimNuget = requireModule("shim-nuget"), pathUnquote = requireModule("path-unquote"), downloadNuget = requireModule("download-nuget"), env = requireModule("env");
    let startedDownload = false, resolver = (_) => {
    }, lastResolution = new Promise(function (resolve) {
        resolver = resolve;
    });
    async function findLocalNuget(quiet) {
        const beQuiet = !!quiet, targetFolder = env.resolve("BUILD_TOOLS_FOLDER"), localNuget = resolveNuget(undefined, false) || path.join(targetFolder, "nuget.exe");
        if (startedDownload) {
            return lastResolution;
        }
        if (await fileExists(pathUnquote(localNuget))) {
            return shimNuget(localNuget);
        }
        startedDownload = true;
        try {
            const result = await downloadNuget(targetFolder, beQuiet);
            resolver(result); // catch up any other code waiting on this
            return result;
        }
        catch (err) {
            if (await fileExists(localNuget)) {
                log.info(err);
                log.info("Falling back on last local nuget.exe");
                resolver(localNuget);
                return localNuget;
            }
            throw err;
        }
    }
    module.exports = findLocalNuget;
})();
