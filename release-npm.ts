(function() {
  const
    Git = require("simple-git/promise"),
    spawn = requireModule<Spawn>("spawn"),
    gulp = requireModule<GulpWithHelp>("gulp"),
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

  gulp.task("release-npm", ["increment-package-json-version"], async () => {

    const
      dryRun = env.resolveFlag("DRY_RUN"),
      git = new Git(),
      version = await readPackageVersion(),
      isBeta = env.resolveFlag("BETA"),
      tag = `v${ version }`;

    let isGitRepo = true;
    try {
    } catch (e) {
      const message = e.message || e.toString();
      isGitRepo = !message.match(/not a git repository/);
    }


    try {
      if (isGitRepo) {
        const branchInfo = await git.branch();
        // ignore this error:  couldn't find remote ref HEAD
        // -> means this is an unknown (new) branch: we should push -u
        try {
          await git.pull("origin", branchInfo.current, { "--rebase": true });
        } catch (e) {
          const isNewBranch = (e.message || "").indexOf("couldn't find remote ref HEAD") > -1;
          if (!isNewBranch) {
            throw e;
          }
        }
      }

      if (dryRun) {
        gutil.log(gutil.colors.yellow(`would publish ${ version }`));
      } else {
        const args = ["publish"];
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
      await rollBackPackageJson();
    } else if (isGitRepo) {
      await git.add(":/");
      await git.commit(`:bookmark: bump package version to ${ version }`);
      await gitTag({ tag });
      await Promise.all([
        gitPush(dryRun),
        gitPushTags(dryRun)
      ]);
    }
  });

})();
