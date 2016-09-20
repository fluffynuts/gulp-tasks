var
  gulp = require('gulp'),
  msbuild = require('gulp-msbuild');

gulp.task('build', ['nuget-restore'], function() {
    return gulp.src(['**/*.sln', '!**/node_modules/**/*.sln'])
            .pipe(msbuild({
                toolsVersion: 14.0,
                targets: ['Clean', 'Build'],
                configuration: 'Debug',
                stdout: true,
                verbosity: 'minimal',
                errorOnFail: true,
                architecture: 'x64'
            }));
});


