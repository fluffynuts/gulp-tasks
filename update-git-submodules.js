const gulp = requireModule("gulp-with-help"),
  status = requireModule("status"),
  Git = require("simple-git/promise"),
  chalk = require("chalk");

gulp.task(
  "update-git-submodules",
  "Updates all git submodules to latest commit on master branch",
  async () => {
    const git = new Git(".");
    await status.run(
      "Check out master on all submodules...",
      async () => await git.subModule(["foreach", "git", "checkout", "master"])
    );
    await status.run(
      "Update to latest commit on each submodule...",
      async () => await git.subModule(["foreach", "git", "pull", "--rebase"])
    );
  }
);

