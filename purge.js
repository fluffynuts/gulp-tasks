var gulp = requireModule('gulp-with-help'),
  purge = requireModule('gulp-purge');
gulp.task('purge', 'Purges all bins, objs, node_modules and nuget packages', function () {
  return gulp.src([
    './source/**/bin/**',
    './source/**/obj/**',
    '!./**/node_modules/**',
    '!./source/**/packages/**'
    ]).pipe(purge({
      dryRun: false,
      debug: false
    }));
});

