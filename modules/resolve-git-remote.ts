(function() {
  const
    env = requireModule<Env>("env"),
    readGitRemote = requireModule<ReadGitRemote>("read-git-remote");

  module.exports = async function resolveGitRemote(at?: string) {
    const fromEnv = env.resolve("GIT_REMOTE");
    if (fromEnv) {
      return fromEnv;
    }
    return readGitRemote(at);
  }
})();
