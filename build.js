const os = require("os"),
  env = requireModule("env"),
  gulp = requireModule("gulp-with-help"),
  gulpDebug = require("gulp-debug"),
  getToolsFolder = requireModule("get-tools-folder"),
  promisifyStream = requireModule("promisify"),
  areAllDotnetCore = requireModule("are-all-dotnet-core"),
  { clean, build } = require("gulp-dotnet-cli"),
  throwIfNoFiles = requireModule("throw-if-no-files"),
  xbuild = requireModule("gulp-xbuild"),
  gutil = requireModule("gulp-util"),
  log = requireModule("log"),
  resolveMasks = requireModule("resolve-masks"),
  msbuild = require("gulp-msbuild");

gulp.task("prebuild", ["nuget-restore"]);

const myTasks = ["build"],
  myVars = [
    "BUILD_CONFIGURATION",
    "BUILD_PLATFORM",
    "BUILD_ARCHITECTURE",
    "BUILD_TARGETS",
    "BUILD_TOOLSVERSION",
    "BUILD_VERBOSITY",
    "BUILD_MSBUILD_NODE_REUSE",
    "BUILD_MAX_CPUCOUNT",
    "BUILD_INCLUDE",
    "BUILD_EXCLUDE"
  ];
env.associate(myVars, myTasks);

gulp.task(
  "build",
  "Builds Visual Studio solutions in tree",
  ["prebuild"],
  doBuild
);

gulp.task("quick-build", "Quick build without pre-cursors", doBuild);

async function doBuild() {
  const slnMasks = resolveMasks("BUILD_INCLUDE", "BUILD_EXCLUDE");
  const solutions = gulp
    .src(slnMasks, { allowEmpty: true })
    .pipe(
      gulpDebug({
        title: "build-sln"
      })
    )
    .pipe(throwIfNoFiles(`No solutions found matching masks: ${slnMasks}}`));

  // TODO: find a reliable, quick way to determine if the projects to be compiled
  //       are all dotnet core -- trawling *.csproj is slow and has caused hangups
  //       here, so for now, DNC build must be requested via env BUILD_DONET_CORE
  return env.resolveFlag("BUILD_DOTNET_CORE")
    ? buildForNetCore(solutions)
    : buildForNETFramework(solutions);
}

function buildForNetCore(solutions) {
  log.info(gutil.colors.yellow("Building with dotnet core"));
  const configuration = env.resolve("BUILD_CONFIGURATION");
  return promisifyStream(
    solutions
      .pipe(
        clean({
          configuration
        })
      )
      .pipe(
        build({
          verbosity: "minimal",
          configuration
        })
      )
  );
}

function buildForNETFramework(solutions) {
  log.info(gutil.colors.yellow("Building with full .NET framework"));
  return promisifyStream(buildAsStream(solutions));
}

function buildAsStream(solutions) {
  const builder = os.platform() === "win32" ? msbuild : xbuild;
  console.log({
    builder,
    solutions
  });
  return solutions
    .pipe(gulpDebug({ title: "before msbuild" }))
    .pipe(
      builder({
        toolsVersion: env.resolve("BUILD_TOOLSVERSION"),
        targets: env.resolveArray("BUILD_TARGETS"),
        configuration: env.resolve("BUILD_CONFIGURATION"),
        stdout: true,
        verbosity: env.resolve("BUILD_VERBOSITY"),
        errorOnFail: true,
        solutionPlatform: env.resolve("BUILD_PLATFORM"),
        // NB: this is the MSBUILD architecture, NOT your desired output architecture
        architecture: env.resolve("BUILD_ARCHITECTURE"),
        nologo: false,
        logCommand: true,
        nodeReuse: env.resolveFlag("BUILD_MSBUILD_NODE_REUSE"),
        maxcpucount: env.resolveNumber("BUILD_MAX_CPU_COUNT")
      })
    )
    .on("end", function() {
      console.log("moo cakes");
    })
    .pipe(gulpDebug({ title: "after msbuild" }));
}
