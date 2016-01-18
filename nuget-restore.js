var gulp = require('gulp');
var child_process = require('child_process');
var nugetRestore = require('./modules/gulp-nuget-restore');

gulp.task('nuget-restore', function(done) {
    return gulp.src('**/*.sln')
            .pipe(nugetRestore({
                debug: true
            }));
});
