"use strict";
(function () {
    const chalk = require("chalk"), env = requireModule("env"), Git = require("simple-git/promise"), readMainBranchName = requireModule("read-main-branch-name"), readAllGitRemotes = requireModule("read-all-git-remotes"), readCurrentBranch = requireModule("read-current-git-branch"), readGitCommitDeltaCount = requireModule("read-git-commit-delta-count"), gulp = requireModule("gulp");
    gulp.task("verify-up-to-date", async () => {
        const remoteInfos = (await readAllGitRemotes()) || [], remotes = remoteInfos.map(r => r.name), mainBranch = env.resolve("GIT_MAIN_BRANCH") || await resolveDefaultVerifyTarget(remotes), verifyBranch = env.resolve("GIT_VERIFY_BRANCH") || await readCurrentBranch();
        if (!mainBranch) {
            throw new Error(`Can't determine main branch (try setting env: GIT_MAIN_BRANCH)`);
        }
        if (!verifyBranch) {
            throw new Error(`Can't determine branch to verify (try setting env: GIT_VERIFY_BRANCH)`);
        }
        if (remotes.length) {
            const git = new Git();
            await git.fetch(["--all"]);
        }
        const verifyResult = await readGitCommitDeltaCount(mainBranch || "master", verifyBranch);
        // TODO: get the delta count & chuck if behind
        const aheadS = verifyResult.ahead === 1 ? "" : "s", behindS = verifyResult.behind === 1 ? "" : "s";
        console.log(`${chalk.yellow(verifyBranch)} is ${chalk.green(verifyResult.ahead)} commit${aheadS} ahead and ${chalk.red(verifyResult.behind)} commit${behindS} behind ${chalk.cyanBright(mainBranch)}`);
        return Promise.resolve();
    });
    async function resolveDefaultVerifyTarget(remotes) {
        remotes = remotes !== null && remotes !== void 0 ? remotes : [];
        const mainBranchName = await readMainBranchName(), remote = remotes[0];
        return remote
            ? `${remote}/${mainBranchName}`
            : mainBranchName;
    }
})();
