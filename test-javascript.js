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

gulp.task('test-javascript', 'Runs all Javascript tests with Karma', function (done) {
  var karmaConf = karmaUtils.findKarmaConf(),
    coverageOutputFolder = karmaUtils.findCoverageOutputFolder();

  karmaUtils.rmdir(coverageOutputFolder);    // make sure it's clean
  log.info('Running karma with config at: ' + karmaConf);

  startKarma(true, karmaConf).then(function() {
    karmaUtils.moveCoverageUpToParentFolderIfPossible();
    done();
  });
});

