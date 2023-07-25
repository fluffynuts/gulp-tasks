(function() {
  const
    gitFactory = require("simple-git"),
    spawn = requireModule<Spawn>("spawn"),
    gulp = requireModule<GulpWithHelp>("gulp"),
    gutil = requireModule<GulpUtil>("gulp-util"),
    gitTag = requireModule<GitTag>("git-tag"),
    gitPushTags = requireModule<GitPushTags>("git-push-tags"),
    { ask } = requireModule<Ask>("ask"),
    gitPush = requireModule<GitPush>("git-push"),
    readGitInfo = requireModule<ReadGitInfo>("read-git-info"),
    env = requireModule<Env>("env"),
    readPackageVersion = requireModule<ReadPackageVersion>("read-package-version"),
    { runTask } = requireModule<RunTask>("run-task"),
    alterPackageJsonVersion = requireModule<AlterPackageJson>("alter-package-json-version");

  async function rollBackPackageJson() {
    await alterPackageJsonVersion({ loadUnsetFromEnvironment: true, incrementBy: -1 });
  }

  gulp.task("release-npm", ["increment-package-json-version"], async () => {

    const
      dryRun = env.resolveFlag("DRY_RUN"),
      git = gitFactory(),
      version = await readPackageVersion(),
      isBeta = env.resolveFlag("BETA"),
      releaseTag = env.resolve("TAG"),
      tag = `v${ version }`,
      gitInfo = await readGitInfo();

    try {
      if (gitInfo.isGitRepository) {
        const branchInfo = await git.branch();
        // ignore this error:  couldn't find remote ref HEAD
        // -> means this is an unknown (new) branch: we should push -u
        if (gitInfo.remotes.length) {
          try {
            await git.pull(
              gitInfo.primaryRemote,
              branchInfo.current, {
                "--rebase": true,
                "--autostash": true
              });
          } catch (ex) {
            const e = ex as Error;
            const isNewBranch = (e.message || e.toString()).indexOf("couldn't find remote ref HEAD") > -1;
            if (!isNewBranch) {
              throw e;
            }
          }
        }
      }

      if (dryRun) {
        gutil.log(gutil.colors.yellow(`would publish ${ version }`));
      } else {
        const
          access = env.resolve("NPM_PUBLISH_ACCESS"),
          args = ["publish", "--access", access];
        if (!!releaseTag) {
          args.push("--tag", releaseTag);
        } else if (isBeta) {
          args.push("--tag", "beta");
        }
        if (await npmSupportsOtpSwitch()) {
          const otp = await ask("Please enter your 2FA OTP");
          args.push("--otp");
          args.push(otp);
        }
        await spawn("npm", args, {
          interactive: true
        });
      }
    } catch (e) {
      await rollBackPackageJson();
      throw e;
    }

    if (dryRun) {
      gutil.log(gutil.colors.yellow(`would commit all updated files`));
      await rollBackPackageJson();
    } else if (gitInfo.isGitRepository) {

      await runTask("git-tag-and-push");
      await git.add(":/");
      await git.commit(`:bookmark: bump package version to ${ version }`);
      await gitTag({ tag });
      await gitPush(dryRun);
      await gitPushTags(dryRun);
    }
  });

  async function npmSupportsOtpSwitch() {
    const result = await spawn("npm", ["publish", "--help"], {
      suppressOutput: true
    });
    const allStdOut = result.stdout.join("\n");
    return allStdOut.indexOf("--otp") > -1;
  }

})();
