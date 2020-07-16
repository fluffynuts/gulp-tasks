"use strict";
(function () {
    const os = require("os"), chalk = require("chalk"), Git = require("simple-git/promise"), readGitRemote = requireModule("read-git-remote"), env = requireModule("env"), exec = requireModule("exec");
    module.exports = async function readMainBranchName() {
        const all = await listBranchesRaw("*"), headRef = all.map(b => {
            const match = b.match(/HEAD -> (.*)/);
            return match
                ? match[1]
                : "";
        }).filter(b => !!b)[0];
        // we don't want "origin" (or whatever the upstream is called)
        if (!headRef || env.resolveFlag("FORCE_ASSUME_MAIN_BRANCH")) {
            // take a guess
            const possibles = [
                "master",
                "main",
                "default"
            ], probableRemote = await readGitRemote(), git = new Git(), branchesResult = await git.branch(["-a"]), allBranches = new Set(branchesResult.all);
            for (const branch of possibles) {
                const test = `remotes/${probableRemote}/${branch}`;
                if (allBranches.has(test)) {
                    const assumed = `${probableRemote}/${branch}`;
                    console.warn(chalk.yellowBright(warn(`Assuming main branch is: '${assumed}'`)));
                    return assumed;
                }
            }
            console.warn(chalk.yellowBright(warn(`Assuming main branch is 'master'`)));
            return "master";
        }
        return headRef.split("/").slice(1).join("/");
    };
    function warn(baseMessage) {
        return `${baseMessage}; override this with the GIT_MAIN_BRANCH environment variable`;
    }
    async function listBranchesRaw(spec) {
        if (!spec) {
            spec = "*";
        }
        const quotedSpec = os.platform() === "win32"
            ? spec // cmd is too dumb to expand * itself and git on windows gets the surrounding '' too, breaking the required logic
            : `'${spec}'`; // !win32 shells will not pass in the '', but, without it, attempt to expand the spec )':
        debugger;
        const raw = await git("--no-pager", "branch", "-a", "--list", quotedSpec);
        return (raw || "").split("\n");
    }
    async function git(...args) {
        return exec("git", args, { suppressOutput: true, mergeIo: true });
    }
})();
