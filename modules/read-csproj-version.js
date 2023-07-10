"use strict";
(function () {
    console.warn(`${__filename} is maintained as a compatibility shim to csproj-utils - rather use that`);
    const { readProjectVersion } = requireModule("csproj-utils");
    module.exports = readProjectVersion;
})();
