const
  gulp = requireModule("gulp-with-help"),
  runSequence = require("run-sequence"),
  msbuild = require("gulp-msbuild");

gulp.task("prebuild", ["nuget-restore", "install-tools"]);

function startBuild(configuration) {
  return gulp.src([
    "**/*.sln",
    "!**/node_modules/**/*.sln",
    "!./tools/**/*.sln"
  ]).pipe(msbuild({
    toolsVersion: "auto",
    targets: ["Clean", "Build"],
    configuration: configuration,
    stdout: true,
    verbosity: "minimal",
    errorOnFail: true,
    architecture: "x64",
    nologo: false
  }));
}

gulp.task("build",
  "Builds all Visual Studio solutions in tree in Debug mode",
  ["prebuild"],
  () => {
    return startBuild("Debug");
  });

gulp.task("build-release",
  "Builds all Visual Studio solutions in tree in Release mode",
  ["prebuild"],
  () => {
    return startBuild("Release");
  });