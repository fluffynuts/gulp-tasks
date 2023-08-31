"use strict";
(function () {
    const env = requireModule("env"), resolveMasks = requireModule("resolve-masks");
    module.exports = function resolveTestMasks(isDotnetCore) {
        if (isDotnetCore === undefined) {
            isDotnetCore = env.resolveFlag("DOTNET_CORE");
        }
        return resolveMasks("TEST_INCLUDE", "TEST_EXCLUDE", p => {
            if (p.match(/\*\*$/)) {
                p += "/*";
            }
            return isDotnetCore
                ? `${p}.csproj`
                : `${p}.dll`;
        });
    };
})();
