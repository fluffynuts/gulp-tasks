"use strict";
(function () {
    const gitFactory = require("simple-git"), spawn = requireModule("spawn"), gulp = requireModule("gulp"), gutil = requireModule("gulp-util"), gitTag = requireModule("git-tag"), gitPushTags = requireModule("git-push-tags"), gitPush = requireModule("git-push"), readGitInfo = requireModule("read-git-info"), env = requireModule("env"), readPackageVersion = requireModule("read-package-version"), alterPackageJsonVersion = requireModule("alter-package-json-version");
    async function rollBackPackageJson() {
        await alterPackageJsonVersion({ loadUnsetFromEnvironment: true, incrementBy: -1 });
    }
    gulp.task("release-npm", ["increment-package-json-version"], async () => {
        const dryRun = env.resolveFlag("DRY_RUN"), git = gitFactory(), version = await readPackageVersion(), isBeta = env.resolveFlag("BETA"), tag = `v${version}`, gitInfo = await readGitInfo();
        try {
            if (gitInfo.isGitRepository) {
                const branchInfo = await git.branch();
                // ignore this error:  couldn't find remote ref HEAD
                // -> means this is an unknown (new) branch: we should push -u
                if (gitInfo.remotes.length) {
                    try {
                        await git.pull(gitInfo.primaryRemote, branchInfo.current, {
                            "--rebase": true,
                            "--autostash": true
                        });
                    }
                    catch (ex) {
                        const e = ex;
                        const isNewBranch = (e.message || e.toString()).indexOf("couldn't find remote ref HEAD") > -1;
                        if (!isNewBranch) {
                            throw e;
                        }
                    }
                }
            }
            if (dryRun) {
                gutil.log(gutil.colors.yellow(`would publish ${version}`));
            }
            else {
                const access = env.resolve("NPM_PUBLISH_ACCESS"), args = ["publish", "--access", access];
                if (isBeta) {
                    args.push("--tag", "beta");
                }
                await spawn("npm", args);
            }
        }
        catch (e) {
            await rollBackPackageJson();
            throw e;
        }
        if (dryRun) {
            gutil.log(gutil.colors.yellow(`would commit all updated files`));
            await rollBackPackageJson();
        }
        else if (gitInfo.isGitRepository) {
            await git.add(":/");
            await git.commit(`:bookmark: bump package version to ${version}`);
            await gitTag({ tag });
            await Promise.all([
                gitPush(dryRun),
                gitPushTags(dryRun)
            ]);
        }
    });
})();
