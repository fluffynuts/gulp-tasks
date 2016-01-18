var gulp = require('gulp');
var ignore = require('gulp-ignore');
var purge = require('./modules/gulp-purge');
gulp.task('purge', function() {
    return gulp.src(['source/**/bin/**', 'source/**/obj/**'])
                .pipe(ignore([
                            'source/**/packages/**',
                            'source/**/node_modules/**',
                            'node_modules/**'
                ]))
                .pipe(purge({
                    dryRun: false,
                    debug: false
                }));
});

