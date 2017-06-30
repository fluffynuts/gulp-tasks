const
  gulp = requireModule("gulp-with-help"),
  runSequence = require("run-sequence"),
  msbuild = require("gulp-msbuild"),
  env = requireModule("env"),
  buildScenarios = requireModule("build-scenarios"),
  vars = {
    solutions: "BUILD_SOLUTIONS",
    targets: "BUILD_TARGETS",
    configurations: "BUILD_CONFIGURATIONS",
    architectures: "BUILD_ARCHITECTURES"
  },
  defaults = {
    solutions: [
      "**/*.sln",
      "!**/node_modules/**/*.sln",
      "!./tools/**/*.sln"
    ],
    targets: [
      "Clean", "Build"
    ],
    configurations: [
      "Debug"
    ]
  }
  getArray = k => env.getArray(vars[k], defaults[k]),
  solutions = getArray("solutions"),
  targets = getArray("targets"),
  configurations = getArray("configurations"),
  architectures = getArray("architectures"),
  allScenarios = buildScenarios.generate(targets, configurations, architectures);


gulp.task("prebuild", ["nuget-restore", "install-tools"]);

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
