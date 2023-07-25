"use strict";
(function () {
    const gulp = requireModule("gulp"), env = requireModule("env"), gitTag = requireModule("git-tag"), gitPushTags = requireModule("git-push-tags"), gitPush = requireModule("git-push");
    env.associate([
        env.GIT_TAG,
        env.GIT_VERSION_INCREMENT_MESSAGE,
        env.DRY_RUN
    ], [
        "git-tag-and-push"
    ]);
    gulp.task("git-tag-and-push", async () => {
        const tag = env.resolveRequired(env.GIT_TAG), dryRun = env.resolveFlag(env.DRY_RUN);
        await gitTag({ tag, dryRun });
        await gitPush(dryRun);
        await gitPushTags(dryRun);
    });
})();
