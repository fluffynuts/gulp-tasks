var gulp = requireModule('gulp-with-help'),
  Server = require('karma').Server,
  karmaUtils = requireModule('karma-utils'),
  log = requireModule('log');

gulp.task('test-find', function() {
  return new Promise(function(resolve, reject) {
    try {
      var conf = karmaUtils.findKarmaConf();
      console.log('resolved: ', conf);
      resolve(conf);
    } catch (e) {
      reject(e);
    }
  });
});

function startKarma(isSingleRun, karmaConf, browsers) {
  var config = {
    configFile: karmaConf,
    singleRun: isSingleRun
  };
  if (browsers && browsers.length) {
    config.browsers = browsers;
  }
  return new Promise(function(resolve, reject) {
    new Server(config, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }).start();
  });
}

function startKarmaLocal(isSingleRun) {
 var karmaConf = karmaUtils.findKarmaConf();
  log.info('Running karma with config at: ' + karmaConf);
  return startKarma(isSingleRun, karmaConf);
}

gulp.task('test-javascript', 'Runs all Javascript tests with Karma', () => {
  var coverageOutputFolder = karmaUtils.findCoverageOutputFolder();
  karmaUtils.rmdir(coverageOutputFolder);

  return startKarmaLocal(true).then(() => {
    karmaUtils.moveCoverageUpToParentFolderIfPossible();
  });

});

gulp.task('watch-javascript', 'Watches all Javascript tests with Karma', () => {
  return startKarmaLocal(false);
});

