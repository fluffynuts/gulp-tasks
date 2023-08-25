(function() {
  const
    alterPackageJsonVersion = requireModule<AlterPackageJson>("alter-package-json-version"),
    env = requireModule<Env>("env"),
    gulp = requireModule<GulpWithHelp>("gulp"),
    taskName = "increment-package-json-version";

  env.associate([
    env.DRY_RUN,
    env.PACKAGE_JSON,
    env.VERSION_INCREMENT_STRATEGY,
    env.VERSION_INCREMENT_ZERO,
    env.INITIAL_RELEASE,
    env.TAG
  ], taskName);

  gulp.task(taskName, async () => {
    return await alterPackageJsonVersion();
  });
})();
