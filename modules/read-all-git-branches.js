"use strict";
(function () {
    const safeGit = requireModule("safe-git"), Git = require("simple-git/promise");
    module.exports = async function readAllBranches(at) {
        return safeGit(async () => {
            const git = new Git(at !== null && at !== void 0 ? at : "."), branches = await git.branch(["-a"]);
            return branches.all;
        }, []);
    };
})();
