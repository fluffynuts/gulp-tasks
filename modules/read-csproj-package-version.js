"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    console.warn(`${__filename} is maintained as a compatibility shim to csproj-utils - rather use that`);
    const { readPackageVersion } = requireModule("csproj-utils");
    module.exports = readPackageVersion;
})();
