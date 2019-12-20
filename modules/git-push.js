const
  Git = require("simple-git/promise"),
  readCurrentBranch = requireModule("read-current-branch"),
  gutil = require("gulp-util"),
  env = requireModule("env"),
  git = new Git();

module.exports = async function gitPush(dryRun) {
  if (dryRun) {
    gutil.log(gutil.colors.green("dry run: should push local commits now..."));
    return Promise.resolve();
  }
  gutil.log(gutil.colors.green("pushing local commits..."));
  const
    remote = env.resolve("GIT_REMOTE"),
    branch = env.resolve("GIT_BRANCH");
    currentBranch = await readCurrentBranch();
  await git.push(
    remote,
    branch || currentBranch
  );
};
