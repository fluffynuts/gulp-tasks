const gulp = requireModule("gulp"),
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
  "TEST_EXCLUDE",
  "TEST_ADDITIONAL_EXCLUDE",
  "TEST_INCLUDE",
  "TEST_ADDITIONAL_INCLUDE",
  "COVERAGE_ADDITIONAL_EXCLUDE",
  "COVERAGE_EXCLUDE"
];
env.associate(myVars, [ "cover-dotnet", "quick-cover-dotnet" ]);

const help = "Runs .NET tests with OpenCover or DotCover";

function cover() {
  const
    configuration = env.resolve("BUILD_CONFIGURATION"),
    inputMasks = resolveMasks(
      "TEST_INCLUDE",
      [ "TEST_EXCLUDE", "TEST_ADDITIONAL_EXCLUDE" ]
    ).map(
      s => `${s}.dll`
    ),
    exclusions = env
      .resolveArray("COVERAGE_EXCLUDE")
      .concat(env.resolveArray("COVERAGE_ADDITIONAL_EXCLUDE")),
    include = env
      .resolveArray("COVERAGE_INCLUDE"),
    exclude = exclusions.filter(e => include.indexOf(e) === -1);

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

gulp.task("cover-dotnet", help, [ "build" ], cover);
gulp.task("quick-cover-dotnet", help, cover);
