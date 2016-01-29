var gulp = require('gulp');
var exec = requireModule('exec');
var log = requireModule('log');

gulp.task('sonar', ['cover-dotnet'], function(done) {
    log.info('Running sonar');
    exec('C:/sonar/sonar-runner-2.4/bin/sonar-runner.bat').then(function() {
        done();
    }).catch(function(err) {
        log.error('Sonar fails: ' + err.code);   
    });
});
