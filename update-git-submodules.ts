(function() {
  const
    gulp = requireModule<Gulp>("gulp"),
    env = requireModule<Env>("env");

  env.associate("UPDATE_SUBMODULES_TO_LATEST", "update-git-submodules");

  gulp.task(
    "update-git-submodules",
    "Updates all git submodules to latest commit on master branch",
    async () => {
      const
        { ExecStepContext } = require("exec-step"),
        ctx = new ExecStepContext(),
        gitFactory = require("simple-git"),
        git = gitFactory(".");
      await ctx.exec(
        "Ensure submodules are initialized...",
        async () => await git.subModule([ "update", "--init" ])
      );
      await ctx.exec(
        "Check out master on all submodules...",
        async () => await git.subModule([ "foreach", "git", "checkout", "master" ])
      );
      await ctx.exec(
        "Update to latest commit on each submodule...",
        async () => await git.subModule([ "foreach", "git", "pull", "--rebase" ])
      );
    }
  );
})();

