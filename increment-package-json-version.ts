const
  alterPackageJsonVersion = requireModule<AlterPackageJson>("alter-package-json-version"),
  env = requireModule<Env>("env"),
  gulp = requireModule<GulpWithHelp>("gulp-with-help"),
  taskName = "increment-package-json-version";

env.associate([
  env.DRY_RUN,
  env.PACKAGE_JSON,
  env.VERSION_INCREMENT_STRATEGY,
  env.VERSION_INCREMENT_ZERO
], taskName);

gulp.task(taskName, async () => {
  return await alterPackageJsonVersion();
});
