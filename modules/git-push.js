const Git = require("simple-git/promise"),
  gutil = require("gulp-util"),
  git = new Git();

module.exports = async function gitPush(dryRun) {
  if (dryRun) {
    gutil.log(gutil.colors.green("dry run: should push local commits now..."));
    return Promise.resolve();
  }
  gutil.log(gutil.colors.green("pushing local commits..."));
  await git.push(
    process.env.GIT_REMOTE || "origin",
    process.env.GIT_BRANCH || "master"
  );
};
