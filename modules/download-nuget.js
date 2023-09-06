"use strict";
(function () {
    const retry = requireModule("retry"), ZarroError = requireModule("zarro-error"), HttpClient = requireModule("http-client"), nugetUpdateSelf = requireModule("nuget-update-self"), logger = requireModule("./log"), path = require("path"), shimNuget = requireModule("shim-nuget"), url = "http://dist.nuget.org/win-x86-commandline/latest/nuget.exe";
    async function downloadNugetTo(targetFolder) {
        logger.debug(`Attempting to download nuget.exe to ${targetFolder}`);
        const downloader = HttpClient.create();
        const downloaded = shimNuget(await downloader.download(url, path.join(targetFolder, "nuget.exe")));
        await validateCanRunExe(downloaded);
        return downloaded;
    }
    const validators = {}, cached = {};
    function validateCanRunExe(exePath) {
        if (!!validators[exePath]) {
            return validators[exePath];
        }
        const shouldLog = !validators[exePath];
        if (shouldLog) {
            logger.debug(`validating exe at: ${exePath}`);
        }
        return validators[exePath] = new Promise(async (resolve, reject) => {
            let lastError = "unknown error", attempts = 0;
            if (cached[exePath]) {
                return resolve(exePath);
            }
            do {
                try {
                    await nugetUpdateSelf(exePath);
                    return resolve(exePath);
                }
                catch (e) {
                    const err = e;
                    lastError = err.message || `${e}`;
                    if (shouldLog) {
                        logger.debug(`failed to run executable (${err.message}); ${attempts < 9
                            ? "will try again"
                            : "giving up"}`);
                    }
                }
            } while (attempts++ < 9);
            reject(new ZarroError(`Unable to download nuget.exe: ${lastError}`));
        });
    }
    module.exports = function downloadNuget(targetFolder) {
        return retry(() => downloadNugetTo(targetFolder)).then(downloaded => {
            console.log(`nuget downloaded to: ${downloaded}`);
            return downloaded;
        });
    };
})();
