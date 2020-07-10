(function () {
  const
    env = requireModule<Env>("env"),
    readCurrentBranch = requireModule<ReadCurrentGitBranch>("read-current-git-branch");

  module.exports = function (at?: string) {
    const fromEnv = env.resolve("GIT_BRANCH");
    if (fromEnv) {
      return fromEnv;
    }
    return readCurrentBranch(at);
  }
})();
