var
  gulp = requireModule("gulp-with-help"),
  getToolsFolder = requireModule("get-tools-folder"),
  areAllDotnetCore = requireModule("are-all-dotnet-core"),
  debug = require("debug")("nuget-restore"),
  debug = require("debug")("nuget-restore"),
  nugetRestore = requireModule("./gulp-nuget-restore"),
  promisify = requireModule("promisify"),
  getToolsFolder = requireModule("get-tools-folder"),
  findLocalNuget = requireModule("find-local-nuget");

gulp.task(
  "nuget-restore",
  "Restores all nuget packages in all solutions",
  ["install-tools"],
  async () => {
    const allDNC = await areAllDotnetCore([
      "**/*.csproj",
      "!**/node_modules/**/*.csproj",
      `!./${getToolsFolder()}/**/*.csproj`
    ]);
    var options = {
      debug: false
    };
    if (allDNC) {
      options.nuget = "dotnet";
    }
    return findLocalNuget().then(() => {
      return promisify(
        gulp
          .src([
            "**/*.sln",
            "!**/node_modules/**/*.sln",
            `!./${getToolsFolder()}/**/*.sln`
          ])
          .pipe(
            nugetRestore(options)
          )
      ).then(() => {
          debug("nuget restore complete!");
        })
        .catch(e => {
          console.error("nugetRestore errs:", e);
          throw new Error(e);
        });
    });
  }
);
