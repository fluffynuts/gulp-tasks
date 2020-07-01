const
  gulp = requireModule("gulp"),
  downloadNuget = requireModule("download-nuget"),
  env = requireModule("env"),
  path = require("path"),
  configGenerator = requireModule("config-generator");

env.associate("BUILD_TOOLS_FOLDER", "get-local-nuget");

gulp.task(
  "get-local-nuget",
  "Attempts to download the latest nuget.exe to the build tooling folder", () => {
    const config = configGenerator();
    return downloadNuget(path.dirname(config.localNuget))
      .then(() => console.log("get-local-nuget completes"));
});
