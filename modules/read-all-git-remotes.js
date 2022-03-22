"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const gitFactory = require("simple-git"), safeGit = requireModule("safe-git");
    module.exports = async function readAllRemotes(at) {
        return safeGit(async () => {
            // technically, a remote can have different urls for fetch and push,
            // but that's an edge-case which just complicates things
            const git = gitFactory(at !== null && at !== void 0 ? at : "."), result = await git.getRemotes(true);
            return result.map((r) => {
                const url = r.refs.fetch || r.refs.push, usage = resolveUsage(!!r.refs.fetch, !!r.refs.push), name = r.name;
                return {
                    name,
                    url,
                    usage
                };
            });
        }, []);
    };
    function resolveUsage(fetch, push) {
        if (fetch && push) {
            return LocalGitRemoteUsage.fetchAndPush;
        }
        return fetch
            ? LocalGitRemoteUsage.fetch
            : LocalGitRemoteUsage.push;
    }
    // hack: can't import the global def, but we need these values
    // for the transpiled js
    let LocalGitRemoteUsage;
    (function (LocalGitRemoteUsage) {
        LocalGitRemoteUsage[LocalGitRemoteUsage["fetch"] = 0] = "fetch";
        LocalGitRemoteUsage[LocalGitRemoteUsage["push"] = 1] = "push";
        LocalGitRemoteUsage[LocalGitRemoteUsage["fetchAndPush"] = 2] = "fetchAndPush";
    })(LocalGitRemoteUsage || (LocalGitRemoteUsage = {}));
})();
