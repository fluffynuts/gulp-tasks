(function() {
  const gulp = requireModule<Gulp>("gulp"),
    status = requireModule<Status>("status"),
    Git = require("simple-git/promise"),
    env = requireModule<Env>("env");

  env.associate("UPDATE_SUBMODULES_TO_LATEST", "update-git-submodules");

  gulp.task(
    "update-git-submodules",
    "Updates all git submodules to latest commit on master branch",
    async () => {
      const git = new Git(".");
      await status.run(
        "Ensure submodules are initialized...",
        async () => await git.subModule(["update", "--init"])
      );
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
})();

