var gulp = require('gulp');
var msbuild = require('gulp-msbuild');
var debug = require('gulp-debug');
var log = require('./modules/log');
var fs = require('fs');

gulp.task('clean', function() {
    return gulp.src('**/*.sln')
            .pipe(msbuild({
                toolsVersion: 4.0,
                targets: ['Clean'],
                configuration: 'Debug',
                stdout: true,
                verbosity: 'normal'
            }));
});


