var gulp = requireModule('gulp-with-help'),
  config = requireModule('config'),
  HttpDownloader = requireModule('http-downloader'),
  verifyExe = requireModule('verify-exe');

gulp.task('get-local-nuget', 'Attempts to download the latest nuget.exe to the gulp-tasks folder', function () {
  var downloader = new HttpDownloader();
  return downloader.download(config.nugetDownloadUrl, config.localNuget).then(function (result) {
    console.log('attempting to verify downloaded nuget.exe');
    return verifyExe(result);
  });
});
