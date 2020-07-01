"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const resolveNuget = require("./resolve-nuget"), exec = require("./exec");
    module.exports = async function (args, execOpts) {
        const nugetPath = await resolveNuget(), argsCopy = args.slice();
        return exec(nugetPath, argsCopy, execOpts);
    };
})();
