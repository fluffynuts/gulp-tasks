"use strict";
(function () {
    const safeGit = requireModule("safe-git"), gitFactory = require("simple-git");
    module.exports = async function readAllBranches(at) {
        return safeGit(async () => {
            const git = gitFactory(at !== null && at !== void 0 ? at : "."), branches = await git.branch(["-a"]);
            return branches.all;
        }, []);
    };
})();
