const
  gulp = requireModule("gulp-with-help"),
  getToolsFolder = requireModule("get-tools-folder"),
  msbuild = require("gulp-msbuild");

gulp.task("prebuild", ["nuget-restore"]);

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
      configuration: process.env.BUILD_CONFIGURATION || "Debug",
      stdout: true,
      verbosity: "minimal",
      errorOnFail: true,
      solutionPlatform: process.env.BUILD_PLATFORM || "Any CPU",
      // NB: this is the MSBUILD architecture, NOT your desired output architecture
      architecture: process.env.BUILD_ARCHITECTURE || "x64",
      nologo: false
    }));
  });
