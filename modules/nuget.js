"use strict";
(function () {
    const resolveNuget = requireModule("resolve-nuget"), findLocalNuget = requireModule("find-local-nuget"), tryDo = requireModule("try-do"), exec = requireModule("system");
    module.exports = async function (args, execOpts) {
        const resolvedNuget = resolveNuget(undefined, false), nugetPath = resolvedNuget || await findLocalNuget(), argsCopy = args.slice();
        return await tryDo(() => exec(nugetPath, argsCopy, execOpts), "RESTORE_RETRIES");
    };
})();
