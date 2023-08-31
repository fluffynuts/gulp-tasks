(function () {
  const gulp = requireModule<Gulp>("gulp");

  gulp.task(
    "generate-reports",
    "runs 'default-report-generator'",
    [ "default-report-generator" ],
    () => Promise.resolve()
  );
})();
