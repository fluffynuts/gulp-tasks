const
  Git = require("simple-git/promise"),
  resolveGitBranch = requireModule("resolve-git-branch"),
  resolveGitRemote = requireModule("resolve-git-remote"),
  gutil = requireModule("gulp-util");

module.exports = async function gitPush(
  dryRun,
  quiet,
  where
) {
  const
    git = new Git(where),
    more = where ? ` (${where})` : "";
  if (dryRun) {
    gutil.log(gutil.colors.green(`dry run: should push local commits now${more}...`));
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
};
