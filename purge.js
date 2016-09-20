var gulp = require('gulp');
var purge = requireModule('gulp-purge');
gulp.task('purge', function() {
    return gulp.src(['./source/**/bin/**', 
                     './source/**/obj/**', 
                     '!./**/node_modules/**',
                     '!./source/**/packages/**'])
                .pipe(purge({
                    dryRun: false,
                    debug: false
                }));
});

