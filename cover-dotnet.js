const gulp = requireModule("gulp-with-help"),
  dotNetCover = requireModule("gulp-dotnetcover"),
  resolveMasks = requireModule("resolve-masks"),
  filter = require("gulp-filter"),
  assemblyFilter = requireModule("net-framework-test-assembly-filter"),
  env = requireModule("env");

const myVars = [
  "BUILD_CONFIGURATION",
  "BUILD_PLATFORM",
  "BUILD_ARCHITECTURE",
  "BUILD_TARGETS",
  "BUILD_TOOLSVERSION",
  "BUILD_VERBOSITY",
  "TEST_ARCHITECTURE",
  "COVERAGE_ADDITIONAL_EXCLUDE",
  "COVERAGE_EXCLUDE",
  "COVERAGE_INCLUDE_ASSEMBLIES",
  "COVERAGE_EXCLUDE_ASSEMBLIES"
];
env.associate(myVars, [ "cover-dotnet", "quick-cover-dotnet" ]);

const help = "Runs .NET tests with OpenCover or DotCover";
function cover() {
  const
    configuration = env.resolve("BUILD_CONFIGURATION"),
    inputMasks = resolveMasks(
    "COVERAGE_INCLUDE_ASSEMBLIES",
    "COVERAGE_EXCLUDE_ASSEMBLIES")
    .map(
      s => `${s}.dll`
    ),
    exclude = env
      .resolveArray("COVERAGE_EXCLUDE")
      .concat(env.resolveArray("COVERAGE_ADDITIONAL_EXCLUDE"));
  return gulp
    .src(inputMasks, { allowEmpty: true })
    .pipe(filter(
        assemblyFilter(configuration)
    ))
    .pipe(
    dotNetCover({
      debug: false,
      architecture: env.resolve("TEST_ARCHITECTURE"),
      exclude
    })
  );
}

gulp.task("cover-dotnet", help, ["build"], cover);
gulp.task("quick-cover-dotnet", help, cover);
