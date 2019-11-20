const
  Git = require("simple-git/promise"),
  gutil = require("gulp-util"),
  git = new Git();

module.exports = async function gitPushTags(dryRun) {
  if (dryRun) {
    gutil.log(gutil.colors.green("dry run: should push tags now..."));
    return Promise.resolve();
  }
  gutil.log(gutil.colors.green("pushing tags..."));
  await git.pushTags(process.env.GIT_REMOTE || "origin");
}
