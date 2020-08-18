"use strict";
(function () {
    const resolveNuget = require("./resolve-nuget"), findLocalNuget = require("./find-local-nuget"), exec = require("./exec");
    module.exports = async function (args, execOpts) {
        const resolvedNuget = await resolveNuget(null, false), nugetPath = resolvedNuget || await findLocalNuget(), argsCopy = args.slice();
        return exec(nugetPath, argsCopy, execOpts);
    };
})();
