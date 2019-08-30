const gulp = requireModule("gulp-with-help"),
  dotNetCover = requireModule("gulp-dotnetcover"),
  resolveMasks = requireModule("resolve-masks"),
  env = requireModule("env");

const myVars = [
  "BUILD_CONFIGURATION",
  "BUILD_PLATFORM",
  "BUILD_ARCHITECTURE",
  "BUILD_TARGETS",
  "BUILD_TOOLSVERSION",
  "BUILD_VERBOSITY",
  "TEST_ARCHITECTURE",
  "COVERAGE_EXCLUDE",
  "COVERAGE_ADDITIONAL_EXCLUDE",
  "COVERAGE_INCLUDE_ASSEMBLIES",
  "COVERAGE_EXCLUDE_ASSEMBLIES"
];
env.associate(myVars, [ "cover-dotnet", "quick-cover-dotnet" ]);

const help = "Runs .NET tests with OpenCover or DotCover";
function runCoverage() {
  const inputMasks = resolveMasks(
    "COVERAGE_INCLUDE_ASSEMBLIES",
    "COVERAGE_EXCLUDE_ASSEMBLIES")
    .map(
      s => `${s}.dll`
    ),
    exclude = env
      .resolveArray("COVERAG_EXCLUDE")
      .concat(env.resolveArray("COVERAGE_ADDITIONAL_EXCLUDE"));
  return gulp.src(inputMasks, { allowEmpty: true }).pipe(
    dotNetCover({
      debug: false,
      architecture: env.resolve("TEST_ARCHITECTURE"),
      exclude
    })
  );
}

gulp.task("cover-dotnet", ["build"], help, runCoverage);
gulp.task("quick-cover-dotnet", help, runCoverage);
