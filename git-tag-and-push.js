"use strict";
(function () {
    const gitFactory = require("simple-git"), gulp = requireModule("gulp"), gutil = requireModule("gulp-util"), env = requireModule("env"), gitTag = requireModule("git-tag"), gitPushTags = requireModule("git-push-tags"), gitPush = requireModule("git-push");
    env.associate([
        env.GIT_TAG_VERSION,
        env.GIT_TAG_COMMIT_MESSAGE,
        env.DRY_RUN
    ], [
        "git-tag-and-push"
    ]);
    gulp.task("git-tag-and-push", async () => {
        const tag = env.resolveRequired(env.GIT_TAG), dryRun = env.resolveFlag(env.DRY_RUN), git = gitFactory();
        const message = `:bookmark: bump package version to ${tag}`;
        if (dryRun) {
            gutil.log(`would have committed all outstanding changes with message: '${message}'`);
        }
        else {
            await git.add(":/");
            await git.commit(message);
        }
        await gitTag({ tag, dryRun });
        await gitPush(dryRun);
        await gitPushTags(dryRun);
    });
})();
