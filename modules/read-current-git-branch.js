"use strict";
(function () {
    const safeGit = requireModule("safe-git"), gitFactory = require("simple-git");
    module.exports = async function readCurrentBranch(at) {
        return safeGit(async () => {
            const git = gitFactory(at !== null && at !== void 0 ? at : "."), branchInfo = await git.branch();
            return branchInfo.current === ""
                ? undefined
                : branchInfo.current; // also returns sha if detached!
        });
    };
})();
