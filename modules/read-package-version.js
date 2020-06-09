"use strict";
(function () {
    const readPackageJson = requireModule("read-package-json");
    module.exports = async function readPackageVersion(packageJsonFile) {
        const index = await readPackageJson(packageJsonFile || "package.json");
        return index.version;
    };
})();
