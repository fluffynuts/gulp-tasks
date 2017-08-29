var gulp = requireModule("gulp-with-help"),
  child_process = require("child_process"),
  debug = require("debug")("nuget-restore"),
  nugetRestore = requireModule("./gulp-nuget-restore"),
  promisify = requireModule("promisify"),
  findLocalNuget = requireModule("find-local-nuget"),
  resolveNuget = requireModule("./resolve-nuget");

gulp.task("nuget-restore",
  "Restores all nuget packages in all solutions",
  ["install-tools"], () => {
    return findLocalNuget().then(() => {
      return promisify(
        gulp.src(["**/*.sln", "!**/node_modules/**/*.sln", "!./tools/**/*.sln"])
          .pipe(nugetRestore({
            debug: false
          }))
      );
  });
})


