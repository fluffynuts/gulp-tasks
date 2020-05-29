(function() {
  const
    Git = require("simple-git/promise"),
    spawn = requireModule<Spawn>("spawn"),
    gulp = requireModule<GulpWithHelp>("gulp-with-help"),
    gutil = requireModule<GulpUtil>("gulp-util"),
    gitTag = requireModule<GitTag>("git-tag"),
    gitPushTags = requireModule<GitPushTags>("git-push-tags"),
    gitPush = requireModule<GitPush>("git-push"),
    env = requireModule<Env>("env"),
    readPackageVersion = requireModule<ReadPackageVersion>("read-package-version"),
    alterPackageJsonVersion = requireModule<AlterPackageJson>("alter-package-json-version");

  async function rollBackPackageJson() {
    await alterPackageJsonVersion({ loadUnsetFromEnvironment: true, incrementBy: -1 });
  }

  gulp.task("release-npm", [ "increment-package-json-version" ], async () => {

    const
      dryRun = env.resolveFlag("DRY_RUN"),
      git = new Git(),
      version = await readPackageVersion(),
      isBeta = env.resolveFlag("BETA"),
      tag = `v${version}`;

    try {
      const branchInfo = await git.branch();
      await git.pull("origin", branchInfo.current, { "--rebase": true });

      if (dryRun) {
        gutil.log(gutil.colors.yellow(`would publish ${version}`));
      } else {
        const args = [ "publish" ];
        if (isBeta) {
          args.push("--tag", "beta");
        }
        await spawn("npm", args);
      }
    } catch (e) {
      await rollBackPackageJson();
      throw e;
    }

    if (dryRun) {
      gutil.log(gutil.colors.yellow(`would commit all updated files`));
    } else {
      await git.add(":/");
      await git.commit(`:bookmark: bump package version to ${version}`);
    }
    await gitTag({ tag });
    await Promise.all([
      gitPush(dryRun),
      gitPushTags(dryRun)
    ]);
    if (dryRun) {
      await rollBackPackageJson();
    }
  });

})();
