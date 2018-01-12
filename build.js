const
  gulp = requireModule("gulp-with-help"),
  getToolsFolder = requireModule("get-tools-folder"),
  runSequence = require("run-sequence"),
  msbuild = require("gulp-msbuild");

gulp.task("prebuild", ["nuget-restore", "install-tools"]);

gulp.task("build",
  "Builds all Visual Studio solutions in tree",
  ["prebuild"],
  () => {
    return gulp.src([
      "**/*.sln",
      "!**/node_modules/**/*.sln",
      `!./${getToolsFolder()}/**/*.sln`
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
