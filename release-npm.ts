(function() {
  const
    gitFactory = require("simple-git"),
    spawn = requireModule<Spawn>("spawn"),
    gulp = requireModule<GulpWithHelp>("gulp"),
    gutil = requireModule<GulpUtil>("gulp-util"),
    ZarroError = requireModule<ZarroError>("zarro-error"),
    { ask } = requireModule<Ask>("ask"),
    readGitInfo = requireModule<ReadGitInfo>("read-git-info"),
    env = requireModule<Env>("env"),
    readPackageVersion = requireModule<ReadPackageVersion>("read-package-version"),
    { runTask } = requireModule<RunTask>("run-task"),
    { withEnvironment } = requireModule<TemporaryEnvironment>("temporary-environment"),
    alterPackageJsonVersion = requireModule<AlterPackageJson>("alter-package-json-version");

  async function rollBackPackageJson() {
    await alterPackageJsonVersion({ loadUnsetFromEnvironment: true, incrementBy: -1 });
  }

  gulp.task("release-npm", [ "increment-package-json-version" ], async () => {

    const
      dryRun = env.resolveFlag("DRY_RUN"),
      git = gitFactory(),
      version = await readPackageVersion(),
      isBeta = env.resolveFlag("BETA"),
      releaseTag = env.resolve("TAG"),
      tag = `v${ version }`,
      gitInfo = await readGitInfo();
    if (version === undefined) {
      throw new ZarroError(`unable to read version from package.json`);
    }

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
              // noinspection ExceptionCaughtLocallyJS
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
          args = [ "publish", "--access", access ];
        if (!!releaseTag) {
          args.push("--tag", releaseTag);
        } else if (isBeta) {
          args.push("--tag", "beta");
        }
        const skipOTP = env.resolveFlag(env.NPM_PUBLISH_SKIP_OTP);
        if (!skipOTP && await npmSupportsOtpSwitch()) {
          const otp = await ask("Please enter your 2FA OTP for NPM");
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
      const
        messageTemplate = env.resolve(env.GIT_VERSION_INCREMENT_MESSAGE),
        message = messageTemplate.replace(/%VERSION%/g, version)

      if (dryRun) {
        gutil.log(`would have committed all outstanding changes with message: '${message}'`);
      } else {
        await git.add(":/");
        await git.commit(`:bookmark: bump package version to ${ version }`);
      }

      await withEnvironment({
        [env.GIT_TAG]: tag
      }).run(async () => {
        await runTask("git-tag-and-push");
      });
    }
  });

  async function npmSupportsOtpSwitch() {
    const result = await spawn("npm", [ "publish", "--help" ], {
      suppressOutput: true
    });
    const allStdOut = result.stdout.join("\n");
    return allStdOut.indexOf("--otp") > -1;
  }

})();
