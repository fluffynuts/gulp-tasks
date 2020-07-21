(function() {
  const
    path = require("path"),
    env = requireModule<Env>("env"),
    debug = require("debug")(path.basename(__filename).replace(/\.(ts|js)$/, "")),
    exec = requireModule<Exec>("exec");
  module.exports = async function findGitCommitDeltaCount(
    main: string,
    branched: string
  ): Promise<GitCommitDeltaCount> {
    const diffLine = `${main}...${branched}`;
    debug(`performing commit diff: ${diffLine}`);
    const
      raw = await exec("git",
        ["rev-list", "--left-right", "--count", diffLine ], {
          suppressOutput: true,
          timeout: env.resolveNumber("GIT_VERIFY_TIMEOUT")
        }),
      lines = raw.trim().split("\n")
        .map(l => l.trim())
        .filter(l => !!l),
      matches = lines[0].match(/(\d*)\s*(\d*)/);
    if (matches === null) {
      throw new Error(`failed to read git rev-list at ${process.cwd()}`);
    }
    return {
      behind: parseInt(matches[1], 10),
      ahead: parseInt(matches[2], 10)
    }
  }
})();
