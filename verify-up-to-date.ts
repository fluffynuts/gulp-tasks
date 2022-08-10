(function() {
  const
    os = require("os"),
    chalk = require("ansi-colors"),
    log = requireModule<Log>("log"),
    env = requireModule<Env>("env"),
    gitFactory = require("simple-git"),
    failAfter = requireModule<FailAfter>("fail-after"),
    readMainBranchName = requireModule<ReadMainBranchName>("read-main-branch-name"),
    readAllGitRemotes = requireModule<ReadAllGitRemotes>("read-all-git-remotes"),
    readCurrentBranch = requireModule<ReadCurrentGitBranch>("read-current-git-branch"),
    readGitCommitDeltaCount = requireModule<ReadGitCommitDeltaCount>("read-git-commit-delta-count"),
    readLastFetchTime = requireModule<ReadLastFetchTime>("read-last-fetch-time"),
    gulp = requireModule<GulpWithHelp>("gulp"),
    { ZarroError } = requireModule("zarro-error"),
    taskName = "verify-up-to-date";

  env.associate([
    "SKIP_FETCH_ON_VERIFY",
    "ENFORCE_VERIFICATION",
    "INTERACTIVE"
  ], taskName);

  gulp.task(taskName, async () => {
    // git on OSX is still inserting a pager somewhere, breaking this, so temporarily
    // disable this test
    if (os.platform() === "darwin") {
      console.warn(
        chalk.redBright(
          `up-to-date verification is experimental on OSX! Please report errors to davydm@gmail.com`
        )
      );
    }
    const
      remoteInfos = (await readAllGitRemotes()) || [],
      remotes = remoteInfos.map(r => r.name),
      mainBranch = env.resolve("GIT_MAIN_BRANCH") || await resolveDefaultVerifyTarget(remotes),
      verifyBranch = env.resolve("GIT_VERIFY_BRANCH") || await readCurrentBranch();
    if (!mainBranch) {
      throw new ZarroError(`Can't determine main branch (try setting env: GIT_MAIN_BRANCH)`);
    }
    if (!verifyBranch) {
      throw new ZarroError(`Can't determine branch to verify (try setting env: GIT_VERIFY_BRANCH)`);
    }
    if (remotes.length && !env.resolveFlag("SKIP_FETCH_ON_VERIFY")) {
      const
        lastFetch = await readLastFetchTime(),
        fetchRecentPeriod = env.resolveNumber("FETCH_RECENT_TIME") * 1000,
        now = Date.now();
      let recentEnough = false;
      if (lastFetch) {
        recentEnough = (now - fetchRecentPeriod) < lastFetch.getTime();
      }
      if (!recentEnough) {
        log.info(`${ taskName } :: fetching all remotes...`);
        const
          git = gitFactory(),
          timeout = env.resolveNumber("GIT_FETCH_TIMEOUT");
        try {
          const fail = failAfter(timeout);
          await Promise.race([
            git.fetch(["--all"]),
            fail.promise
          ]);
          fail.cancel();
        } catch (ex) {
          const e = ex as Error;
          const msg = e.message || e;
          if (msg === "operation timed out") {
            log.error(chalk.redBright(`fetch operation timed out:
 - check that the current account can fetch from all remotes
 - optionally disable fetch with SKIP_FETCH_ON_VERIFY=1
 - optionally increase GIT_FETCH_TIMEOUT from current value: ${timeout}`))
          }
        }
      } else {
        log.info(`${ taskName } :: skipping fetch: was last done at ${ lastFetch }`);
      }
    }
    const verifyResult = await readGitCommitDeltaCount(
      mainBranch || "master", verifyBranch);
    // TODO: get the delta count & chuck if behind
    const
      aheadS = verifyResult.ahead === 1 ? "" : "s",
      behindS = verifyResult.behind === 1 ? "" : "s",
      message = `${
        chalk.yellow(verifyBranch)
      } is ${
        chalk.green(verifyResult.ahead)
      } commit${ aheadS } ahead and ${
        chalk.red(verifyResult.behind)
      } commit${ behindS } behind ${
        chalk.cyanBright(mainBranch)
      }`;
    log.info(`${ taskName } :: ${ message }`);

    if (verifyResult.behind > 0) {
      if (env.resolveFlag("ENFORCE_VERIFICATION")) {
        throw new ZarroError(message);
      }
      if (env.resolveFlag("INTERACTIVE")) {
        console.error(`interactive mode for verify-up-to-date is not yet implemented`);
        // TODO: ask if the user would like to merge in master & proceed if ok
      }
    }
  });

  async function resolveDefaultVerifyTarget(remotes?: string[]) {
    remotes = remotes ?? [];
    const
      mainBranchName = await readMainBranchName(),
      remote = remotes[0];
    if (mainBranchName?.startsWith(`${ remote }/`)) {
      return mainBranchName;
    }
    return remote
      ? `${ remote }/${ mainBranchName }`
      : mainBranchName
  }
})();
