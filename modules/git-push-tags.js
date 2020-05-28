const
  Git = require("simple-git/promise"),
  gutil = requireModule("gulp-util");

module.exports = async function gitPushTags(dryRun, where) {
  const
    git = new Git(where),
    more = where ? ` (${where})` : ""
  if (dryRun) {
    gutil.log(gutil.colors.green(`dry run: should push tags now${more}...`));
    return Promise.resolve();
  }
  gutil.log(gutil.colors.green(`pushing tags${more}...`));
  await git.pushTags(process.env.GIT_REMOTE || "origin");
}
