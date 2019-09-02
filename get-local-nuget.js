var
  gulp = requireModule("gulp-with-help"),
  env = requireModule("env"),
  config = requireModule("config"),
  HttpDownloader = requireModule("http-downloader"),
  verifyExe = requireModule("verify-exe");

env.associate("BUILD_TOOLS_FOLDER", "get-local-nuget");

gulp.task(
  "get-local-nuget",
  "Attempts to download the latest nuget.exe to the build tooling folder", () => {
  var downloader = new HttpDownloader();
  return downloader.download(config.nugetDownloadUrl, config.localNuget).then(function (result) {
    console.log("attempting to verify downloaded nuget.exe");
    return verifyExe(result);
  });
});
