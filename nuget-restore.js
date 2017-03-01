var gulp = requireModule('gulp-with-help'),
  child_process = require('child_process'),
  nugetRestore = requireModule('./gulp-nuget-restore'),
  resolveNuget = requireModule('./resolve-nuget');

function createNugetRestoreTask() {
  var deps = [];
  try {
    resolveNuget();
  } catch (ignore) {
    console.log('should download nuget');
    deps.push('get-local-nuget');
  }
  gulp.task('nuget-restore', 'Restores all nuget packages in all solutions', deps, function () {
    return gulp.src(['**/*.sln', '!**/node_modules/**/*.sln'])
      .pipe(nugetRestore({
        debug: false
      }));
  });
}

createNugetRestoreTask();
