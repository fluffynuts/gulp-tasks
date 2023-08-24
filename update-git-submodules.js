"use strict";
(function () {
    const gulp = requireModule("gulp"), env = requireModule("env");
    env.associate("UPDATE_SUBMODULES_TO_LATEST", "update-git-submodules");
    gulp.task("update-git-submodules", "Updates all git submodules to latest commit on master branch", async () => {
        const { ExecStepContext } = require("exec-step"), ctx = new ExecStepContext(), gitFactory = require("simple-git"), git = gitFactory(".");
        await ctx.run("Ensure submodules are initialized...", async () => await git.subModule(["update", "--init"]));
        await ctx.run("Check out master on all submodules...", async () => await git.subModule(["foreach", "git", "checkout", "master"]));
        await ctx.run("Update to latest commit on each submodule...", async () => await git.subModule(["foreach", "git", "pull", "--rebase"]));
    });
})();
