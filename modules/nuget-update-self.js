"use strict";
(function () {
    const os = require("os"), which = requireModule("which"), isWindows = os.platform() === "win32", path = require("path"), debug = requireModule("debug"), env = requireModule("env"), system = requireModule("system");
    let updating;
    module.exports = function (nugetPath) {
        if (env.resolveFlag("SKIP_NUGET_UPDATES")) {
            return Promise.resolve();
        }
        if (updating) {
            return updating;
        }
        return updating = new Promise(async (resolve, reject) => {
            debug(`Requesting self-update from '${nugetPath}'`);
            if (isWindows) {
                try {
                    await system(nugetPath, ["update", "-self"], { suppressOutput: true });
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
                finally {
                    updating = undefined;
                }
            }
            else {
                const ext = path.extname(nugetPath);
                const mono = which("mono");
                if (!mono) {
                    throw new Error(`To run nuget.exe on this platform, you must install mono`);
                }
                try {
                    if (ext) {
                        await system("mono", [
                            nugetPath,
                            "update",
                            "-self"
                        ], { suppressOutput: true });
                    }
                    else {
                        await system(nugetPath, ["update", "-self"], { suppressOutput: true });
                    }
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
                finally {
                    updating = undefined;
                }
            }
        });
    };
})();
