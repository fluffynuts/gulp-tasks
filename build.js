const
  chalk = require("ansi-colors"),
  os = require("os"),
  env = requireModule("env"),
  gulp = requireModule("gulp"),
  debug = require("debug")("build"),
  promisifyStream = requireModule("promisify"),
  dotnetCli = require("gulp-dotnet-cli"),
  dotnetClean = dotnetCli.clean,
  dotnetBuild = dotnetCli.build,
  throwIfNoFiles = requireModule("throw-if-no-files"),
  xbuild = requireModule("gulp-xbuild"),
  gutil = requireModule("gulp-util"),
  log = requireModule("log"),
  resolveMasks = requireModule("resolve-masks"),
  logConfig = requireModule("log-config"),
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
    "BUILD_MAX_CPU_COUNT",
    "MAX_CONCURRENCY",
    "BUILD_INCLUDE",
    "BUILD_EXCLUDE",
    "BUILD_ADDITIONAL_EXCLUDE",
    "BUILD_SHOW_INFO",
    "BUILD_FAIL_ON_ERROR"
  ];
env.associate(myVars, myTasks);

gulp.task(
  "build",
  "Builds Visual Studio solutions in tree",
  ["prebuild"],
  build
);

gulp.task("quick-build", "Quick build without pre-cursors", build);

async function build() {
  const slnMasks = resolveMasks("BUILD_INCLUDE", [ "BUILD_EXCLUDE", "BUILD_ADDITIONAL_EXCLUDE"]);
  debug({
    slnMasks,
    cwd: process.cwd()
  });
  const solutions = gulp
    .src(slnMasks, { allowEmpty: true })
    .pipe(throwIfNoFiles(`No solutions found matching masks: ${slnMasks}}`));

  // TODO: find a reliable, quick way to determine if the projects to be compiled
  //       are all dotnet core -- trawling *.csproj is slow and has caused hangups
  //       here, so for now, DNC build must be requested via env DONET_CORE
  return env.resolveFlag("DOTNET_CORE")
    ? buildForNetCore(solutions)
    : buildForNETFramework(solutions);
}

function buildForNetCore(solutions) {
  log.info(gutil.colors.yellow("Building with dotnet core"));
  const
    configuration = env.resolve("BUILD_CONFIGURATION"),
    msbuildArgs = [];
  if (!env.resolveFlag("BUILD_MSBUILD_NODE_REUSE")) {
    msbuildArgs.push("/nodeReuse:false")
  }
  return promisifyStream(
    solutions
      .pipe(
        dotnetClean({
          configuration
        })
      )
      .pipe(
        dotnetBuild({
          verbosity: env.resolve("BUILD_VERBOSITY"),
          configuration,
          // msbuild attempts to re-use nodes, which causes issues
          // if you're building unrelated projects on the same machine with,
          // eg, different versions of Microsoft.Net.Compilers
          msbuildArgs,
          echo: true
        })
      )
  );
}

function buildForNETFramework(solutions) {
  log.info(chalk.yellowBright("Building with MsBuild"));
  return promisifyStream(buildAsStream(solutions));
}

function buildAsStream(solutions) {
  const builder = os.platform() === "win32" ? msbuild : xbuild;
  const config = {
    toolsVersion: env.resolve("BUILD_TOOLSVERSION"),
    targets: env.resolveArray("BUILD_TARGETS"),
    configuration: env.resolve("BUILD_CONFIGURATION"),
    stdout: true,
    verbosity: env.resolve("BUILD_VERBOSITY"),
    errorOnFail: env.resolveFlag("BUILD_FAIL_ON_ERROR"),
    solutionPlatform: env.resolve("BUILD_PLATFORM"),
    // NB: this is the MSBUILD architecture, NOT your desired output architecture
    architecture: env.resolve("BUILD_ARCHITECTURE"),
    nologo: false,
    logCommand: true,
    nodeReuse: env.resolveFlag("BUILD_MSBUILD_NODE_REUSE"),
    maxcpucount: env.resolveNumber("BUILD_MAX_CPU_COUNT")
  };

  if (env.resolveFlag("BUILD_SHOW_INFO")) {
    logConfig(config, {
      toolsVersion: "Tools version",
      targets: "Build targets",
      configuration: "Build configuration",
      stdout: "Log to stdout",
      verbosity: "Build verbosity",
      errorOnFail: "Any error fails the build",
      solutionPlatform: "Build platform",
      architecture: "Build architecture",
      nodeReuse: "Re-use MSBUILD nodes",
      maxcpucount: "Max CPUs to use for build",
    });
  }
  return solutions
    .pipe(builder(config));
}
