"use strict";
(function () {
    const safeGit = requireModule("safe-git"), Git = require("simple-git/promise");
    module.exports = async function readCurrentBranch(at) {
        return safeGit(async () => {
            const git = new Git(at !== null && at !== void 0 ? at : "."), branchInfo = await git.branch();
            return branchInfo.current === ""
                ? undefined
                : branchInfo.current; // also returns sha if detached!
        });
    };
})();
