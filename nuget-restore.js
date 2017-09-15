var gulp = requireModule("gulp-with-help"),
  debug = require("debug")("nuget-restore"),
  child_process = require("child_process"),
  debug = require("debug")("nuget-restore"),
  nugetRestore = requireModule("./gulp-nuget-restore"),
  promisify = requireModule("promisify"),
  findLocalNuget = requireModule("find-local-nuget");

gulp.task("nuget-restore",
  "Restores all nuget packages in all solutions",
  ["install-tools"], () => {
    return findLocalNuget().then(() => {
      return promisify(
        gulp.src(["**/*.sln", "!**/node_modules/**/*.sln", "!./tools/**/*.sln"])
          .pipe(nugetRestore({
            debug: false
          }))
      ).then(() => {
        debug("nuget restore complete!");
      }).catch(e => {
        console.error("nugetRestore errs:", e);
        throw new Error(e);
      });
  });
})


