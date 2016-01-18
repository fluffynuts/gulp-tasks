var gulp = require('gulp');
var karma = require('karma');
var karmaUtils = require('./modules/karma-utils');

(function() {
    gulp.task('karma', function(done) {
        var karmaConf = karmaUtils.findKarmaConf();
        console.log('Running karma with config at: ' + karmaConf);
        karma.server.start({
            configFile: karmaConf,
            singleRun: false
        }, function() {
            done();
        });
    });
})();

