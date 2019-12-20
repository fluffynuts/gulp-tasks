const
  Git = require("simple-git/promise"),
  resolveGitBranch = requireModule("resolve-git-branch"),
  resolveGitRemote = requireModule("resolve-git-remote"),
  gutil = requireModule("gulp-util"),
  git = new Git();

module.exports = async function gitPush(dryRun, quiet) {
  if (dryRun) {
    gutil.log(gutil.colors.green("dry run: should push local commits now..."));
    return Promise.resolve();
  }
  if (!quiet) {
    gutil.log(gutil.colors.green("pushing local commits..."));
  }
  const
    remote = await resolveGitRemote(),
    branch = await resolveGitBranch();
  await git.push(
    remote,
    branch
  );
};
