"use strict";
(function () {
    const ZarroError = requireModule("zarro-error"), HttpClient = requireModule("http-client"), nugetUpdateSelf = requireModule("nuget-update-self"), logger = requireModule("./log"), path = require("path"), url = "http://dist.nuget.org/win-x86-commandline/latest/nuget.exe";
    function downloadNugetTo(targetFolder) {
        logger.debug(`Attempting to download nuget.exe to ${targetFolder}`);
        const downloader = HttpClient.create(), target = path.join(targetFolder, "nuget.exe");
        return downloader
            .download(url, path.join(targetFolder, "nuget.exe"))
            .then(() => validateCanRunExe(target));
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
        return validators[exePath] = new Promise((resolve, reject) => {
            let lastMessage = "unknown error", attempts = 0;
            setTimeout(function testExe() {
                if (cached[exePath]) {
                    return resolve(exePath);
                }
                if (attempts === 10) {
                    return reject(`Unable to run executable at ${exePath}: ${lastMessage}`);
                }
                attempts++;
                if (shouldLog) {
                    logger.debug(`attempt #${attempts} to run ${exePath}`);
                }
                const a = attempts;
                nugetUpdateSelf(exePath).then(() => {
                    if (shouldLog) {
                        const sub = a > 1 ? ` (${a})` : "";
                        logger.info(`nuget.exe appears to be valid!${sub}`);
                    }
                    cached[exePath] = true;
                    return resolve(exePath);
                }).catch(e => {
                    lastMessage = e.message || lastMessage;
                    if (shouldLog) {
                        logger.debug(`failed to run executable (${e.message}); ${attempts < 9
                            ? "will try again"
                            : "giving up"}`);
                    }
                    setTimeout(testExe, 1000);
                });
            }, 1000);
        });
    }
    function retry(fn, attempt, maxAttempts, wait) {
        let thisAttempt = attempt !== null && attempt !== void 0 ? attempt : 0;
        const max = maxAttempts !== null && maxAttempts !== void 0 ? maxAttempts : 10;
        let waitMs = wait !== null && wait !== void 0 ? wait : 5000;
        if (waitMs < 1000) {
            waitMs *= 1000;
        }
        return fn().catch(e => {
            if (thisAttempt >= max) {
                throw new ZarroError(`${e} (giving up after ${attempt} attempts)`);
            }
            else {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        console.warn(e);
                        console.log(`trying again in ${waitMs / 1000}s (${++thisAttempt} / ${max})`);
                        retry(fn, attempt, maxAttempts, wait).then(function () {
                            resolve(Array.from(arguments)[0]);
                        }).catch(function () {
                            reject(Array.from(arguments));
                        });
                    }, wait);
                });
            }
        });
    }
    module.exports = function downloadNuget(targetFolder) {
        return retry(() => downloadNugetTo(targetFolder)).then(downloaded => {
            console.log(`nuget downloaded to: ${downloaded}`);
            return downloaded;
        });
    };
})();
