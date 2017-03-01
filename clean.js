var gulp = requireModule('gulp-with-help'),
    msbuild = require('gulp-msbuild'),
    debug = require('gulp-debug'),
    log = requireModule('log'),
    fs = require('fs');

gulp.task('clean', 'Invokes the "Clean" target on all solutions in the tree', function() {
    return gulp.src('**/*.sln')
            .pipe(msbuild({
                toolsVersion: 4.0,
                targets: ['Clean'],
                configuration: 'Debug',
                stdout: true,
                verbosity: 'normal'
            }));
});


