(function () {
  const
    gulp = requireModule<Gulp>("gulp"),
    downloadNuget = requireModule<DownloadNuget>("download-nuget"),
    env = requireModule<Env>("env"),
    path = require("path"),
    configGenerator = requireModule<ResolveNugetConfigGenerator>("resolve-nuget-config-generator");

  env.associate("BUILD_TOOLS_FOLDER", "get-local-nuget");

  gulp.task(
    "get-local-nuget",
    "Attempts to download the latest nuget.exe to the build tooling folder", () => {
      const config = configGenerator();
      return downloadNuget(path.dirname(config.localNuget))
        .then(() => console.log("get-local-nuget completes"));
    }
  );
})();
