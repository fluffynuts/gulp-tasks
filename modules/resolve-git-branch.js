const
  env = requireModule("env"),
  readCurrentBranch = requireModule("read-current-branch");

module.exports = async function() {
  const fromEnv = env.resolve("GIT_BRANCH");
  if (fromEnv) {
    return fromEnv;
  }
  return await readCurrentBranch();
}
