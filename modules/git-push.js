const
  Git = require("simple-git/promise"),
  resolveGitBranch = requireModule("resolve-git-branch"),
  resolveGitRemote = requireModule("resolve-git-remote"),
  gutil = requireModule("gulp-util");

async function gitPush(
  dryRun,
  quiet,
  where
) {
  if (typeof dryRun === "object") {
    quiet = dryRun.quiet || false;
    where = dryRun.where || ".";
    dryRun = dryRun.dryRun || false;
  } else if (quiet !== undefined) {
    gutil.log.warn(
      gutil.colors.red(
        "depreciation warning: options for git-push should be sent via an object"
      )
    );
  }
  where = where || ".";
  quiet = !!quiet;
  const
    git = new Git(where),
    more = where ? ` (${where})` : "";
  if (dryRun) {
    gutil.log(gutil.colors.green(`dry run: whould push local commits now${more}...`));
    return Promise.resolve();
  }
  if (!quiet) {
    gutil.log(gutil.colors.green(`pushing local commits${more}...`));
  }
  const
    remote = await resolveGitRemote(),
    branch = await resolveGitBranch();
  await git.push(
    remote,
    branch
  );
}

module.exports = gitPush;
