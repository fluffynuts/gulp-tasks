const
  gulp = requireModule("gulp-with-help"),
  runSequence = require("run-sequence"),
  msbuild = require("gulp-msbuild");

gulp.task("prebuild", done => {
  runSequence("nuget-restore", "install-tools", done)
});

gulp.task("build",
  "Builds all Visual Studio solutions in tree",
  ["prebuild"],
  () => {
    return gulp.src([
      "**/*.sln",
      "!**/node_modules/**/*.sln",
      "!./tools/**/*.sln"
    ]).pipe(msbuild({
      toolsVersion: "auto",
      targets: ["Clean", "Build"],
      configuration: "Debug",
      stdout: true,
      verbosity: "minimal",
      errorOnFail: true,
      architecture: "x64",
      nologo: false
    }));
  });
