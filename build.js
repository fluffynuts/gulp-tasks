var
  gulp = require('gulp'),
  msbuild = require('gulp-msbuild'),
  gulpIgnore = require('gulp-ignore');
gulp.task('build', ['nuget-restore'], function() {
    return gulp.src('**/*.sln')
            .pipe(gulpIgnore.exclude('**/node_modules/**'))
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


