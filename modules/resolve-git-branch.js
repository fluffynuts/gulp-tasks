"use strict";
(function () {
    const env = requireModule("env"), readCurrentBranch = requireModule("read-current-git-branch");
    module.exports = function (at) {
        const fromEnv = env.resolve("GIT_BRANCH");
        if (fromEnv) {
            return fromEnv;
        }
        return readCurrentBranch(at);
    };
})();
