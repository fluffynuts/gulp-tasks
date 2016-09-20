var gulp = require('gulp');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');

gulp.task('default', function() {
    runSequence('purge', 'git-submodules', 'build', 'cover-dotnet', function(err) {
      return new Promise(function(resolve, reject) {
        if (err) {
            gutil.log(gutil.colors.red(gutil.colors.bold(err)));
            reject(err);
        } else {
          resolve();
        }
      });
    });
});

