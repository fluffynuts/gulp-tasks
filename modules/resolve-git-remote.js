const
  env = requireModule("env"),
  git = require("simple-git/promise");

module.exports = async function() {
  const fromEnv = env.resolve("GIT_REMOTE");
  if (fromEnv) {
    return fromEnv;
  }
  const
    raw = await git().remote([]),
    all = raw.trim().split("\n").map(remote => remote.trim()),
    first = all[0];
  if (all.length > 1) {
    console.log(`WARNING: assuming first remote found (${first}) is the one you want; otherwise specify GIT_REMOTE or GIT_OVERRIDE_REMOTE environment variable`);
  }
  return first;
}
