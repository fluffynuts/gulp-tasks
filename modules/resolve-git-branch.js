const
  env = requireModule("env"),
  readLocalBranch = requireModule("read-local-branch");

module.exports = async function() {
  const fromEnv = env.resolve("GIT_BRANCH");
  if (fromEnv) {
    return fromEnv;
  }
  return await readLocalBranch();
}
