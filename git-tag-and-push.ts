(function() {
  const
    gulp = requireModule<Gulp>("gulp"),
    env = requireModule<Env>("env"),
    gitTag = requireModule<GitTag>("git-tag"),
    gitPushTags = requireModule<GitPushTags>("git-push-tags"),
    gitPush = requireModule<GitPush>("git-push");

  env.associate([
    env.GIT_TAG,
    env.GIT_VERSION_INCREMENT_MESSAGE,
    env.DRY_RUN
  ], [
    "git-tag-and-push"
  ]);

  gulp.task("git-tag-and-push", async () => {
    const
      tag = env.resolveRequired(env.GIT_TAG),
      dryRun = env.resolveFlag(env.DRY_RUN);

    await gitTag({ tag, dryRun });
    await gitPush(dryRun);
    await gitPushTags(dryRun);
  });
})();
