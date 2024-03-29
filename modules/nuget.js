"use strict";
(function () {
    const resolveNuget = requireModule("resolve-nuget"), findLocalNuget = requireModule("find-local-nuget"), tryDo = requireModule("try-do"), exec = requireModule("exec");
    module.exports = async function (args, opts) {
        const resolvedNuget = resolveNuget(undefined, false), nugetPath = resolvedNuget || await findLocalNuget(), argsCopy = args.slice();
        return await tryDo(async () => {
            return await exec(nugetPath, argsCopy, opts);
        }, "RESTORE_RETRIES");
    };
})();
