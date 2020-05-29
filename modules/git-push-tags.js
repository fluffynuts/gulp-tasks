const
  Git = require("simple-git/promise"),
  gutil = requireModule("gulp-util");

async function gitPushTags(dryRun, where) {
  let quiet = false;
  if (typeof dryRun === "object") {
    where = dryRun.where || ".";
    quiet = dryRun.quiet || false;
    dryRun = dryRun.dryRun || false;
  } else if (where !== undefined) {
    gutil.log.warn(
      gutil.colors.red(
        "depreciation warning: options for git-push-tags should be sent via an object"
      )
    );
  }
  where = where || ".";
  const
    git = new Git(where),
    more = where ? ` (${where})` : ""
  if (dryRun) {
    if (!quiet) {
      gutil.log(gutil.colors.green(`dry run: should push tags now${more}...`));
    }
    return Promise.resolve();
  }
  gutil.log(gutil.colors.green(`pushing tags${more}...`));
  await git.pushTags(process.env.GIT_REMOTE || "origin");
}

module.exports = gitPushTags;
