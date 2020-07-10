"use strict";
(function () {
    const env = requireModule("env"), readGitRemote = requireModule("read-git-remote");
    module.exports = async function resolveGitRemote(at) {
        const fromEnv = env.resolve("GIT_REMOTE");
        if (fromEnv) {
            return fromEnv;
        }
        return readGitRemote(at);
    };
})();
