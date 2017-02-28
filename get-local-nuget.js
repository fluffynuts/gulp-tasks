var gulp = require('gulp'),
    config = requireModule('config'),
    HttpDownloader = requireModule('http-downloader'),
    verifyExe = requireModule('verify-exe');

gulp.task('get-local-nuget', function() {
    return new Promise(function(resolve, reject) {
      var downloader = new HttpDownloader();
      return downloader.download(config.nugetDownloadUrl, config.localNuget).then(function(result) {
        console.log('attempting to verify downloaded nuget.exe');
        return verifyExe(result);
      });
    });
});