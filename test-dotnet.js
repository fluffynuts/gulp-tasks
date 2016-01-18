var gulp = require('gulp');
var fs = require('fs');
var nunit = require('gulp-nunit-runner');
var testUtilFinder = require('./modules/testutil-finder');

gulp.task('test-dotnet', function() {
    if (!fs.existsSync('buildreports')) {
        fs.mkdir('buildreports');
    }
    return gulp.src(['**/bin/Debug/**/*.Tests.dll', '**/bin/*.Tests.dll'], { read: false })
                .pipe(nunit({
                    executable: testUtilFinder.latestNUnit({architecture: 'x86'}),
                    options: {
                        result: 'buildreports/nunit-result.xml'
                    }
                }));
});

