(function() {
  const
    chalk = require("ansi-colors"),
    log = requireModule<Log>("log"),
    env = requireModule<Env>("env"),
    Git = require("simple-git/promise"),
    failAfter = requireModule<FailAfter>("fail-after"),
    readMainBranchName = requireModule<ReadMainBranchName>("read-main-branch-name"),
    readAllGitRemotes = requireModule<ReadAllGitRemotes>("read-all-git-remotes"),
    readCurrentBranch = requireModule<ReadCurrentGitBranch>("read-current-git-branch"),
    readGitCommitDeltaCount = requireModule<ReadGitCommitDeltaCount>("read-git-commit-delta-count"),
    readLastFetchTime = requireModule<ReadLastFetchTime>("read-last-fetch-time"),
    gulp = requireModule<GulpWithHelp>("gulp"),
    taskName = "verify-up-to-date";

  env.associate([
    "SKIP_FETCH_ON_VERIFY",
    "ENFORCE_VERIFICATION"
  ], taskName);

  gulp.task(taskName, async () => {
    const
      remoteInfos = (await readAllGitRemotes()) || [],
      remotes = remoteInfos.map(r => r.name),
      mainBranch = env.resolve("GIT_MAIN_BRANCH") || await resolveDefaultVerifyTarget(remotes),
      verifyBranch = env.resolve("GIT_VERIFY_BRANCH") || await readCurrentBranch();
    if (!mainBranch) {
      throw new Error(`Can't determine main branch (try setting env: GIT_MAIN_BRANCH)`);
    }
    if (!verifyBranch) {
      throw new Error(`Can't determine branch to verify (try setting env: GIT_VERIFY_BRANCH)`);
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
          git = new Git(),
          timeout = env.resolveNumber("GIT_FETCH_TIMEOUT");
        try {
          const fail = failAfter(timeout);
          await Promise.race([
            git.fetch(["--all"]),
            fail.promise
          ]);
          fail.cancel();
        } catch (e) {
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

    if (verifyResult.behind > 0 &&
      env.resolveFlag("ENFORCE_VERIFICATION")) {
      throw new Error(message);
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
