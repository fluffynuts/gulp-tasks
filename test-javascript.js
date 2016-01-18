var gulp = require('gulp');
var karma = require('karma');
var karmaUtils = require('./modules/karma-utils');
var log = require('./modules/log');

(function() {
    gulp.task('test-javascript', function(done) {
        var karmaConf = karmaUtils.findKarmaConf();
        var coverageOutputFolder = karmaUtils.findCoverageOutputFolder();
        var parts = coverageOutputFolder.split('/');
        var canMoveUp = parts.length > 1;
        karmaUtils.rmdir(coverageOutputFolder);    // make sure it's clean
        log.info('Running karma with config at: ' + karmaConf);
        karma.server.start({
            configFile: karmaConf,
            singleRun: true
        }, function() {
            karmaUtils.moveCoverageUpToParentFolderIfPossible();
            done();
        });
    });
})();

