var
  env = requireModule("env"),
  gulp = requireModule("gulp-with-help"),
  getToolsFolder = requireModule("get-tools-folder"),
  debug = require("debug")("nuget-restore"),
  debug = require("debug")("nuget-restore"),
  nugetRestore = requireModule("./gulp-nuget-restore"),
  promisify = requireModule("promisify"),
  getToolsFolder = requireModule("get-tools-folder"),
  findLocalNuget = requireModule("find-local-nuget");

env.associate("DOTNET_CORE", "nuget-restore");

gulp.task(
  "nuget-restore",
  "Restores all nuget packages in all solutions",
  ["install-tools"],
  async () => {
    const allDNC = env.resolveFlag("DOTNET_CORE");
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
