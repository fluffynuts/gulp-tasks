"use strict";
(function () {
    const os = require("os"), path = require("path"), { fileExistsSync, writeTextFileSync, chmodSync } = require("yafs"), pathUnquote = requireModule("path-unquote"), isWindows = os.platform() === "win32";
    function shimNuget(nugetPath) {
        const pathToNuget = pathUnquote(nugetPath || "");
        if (!fileExistsSync(pathToNuget)) {
            throw new Error(`file not found: ${pathToNuget}`);
        }
        if (isWindows) {
            return pathToNuget;
        }
        const ext = path.extname(pathToNuget);
        if (!ext) {
            // provided path is probably already a shim;
            return pathToNuget;
        }
        const folder = path.dirname(pathToNuget), shim = path.join(folder, "nuget");
        if (fileExistsSync(shim)) {
            return shim;
        }
        writeTextFileSync(shim, `#!/bin/sh
mono $(dirname $0)/nuget.exe $*
`);
        chmodSync(shim, "777");
        return shim;
    }
    module.exports = shimNuget;
})();
