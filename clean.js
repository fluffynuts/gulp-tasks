const
  gulp = requireModule("gulp"),
  promisifyStream = requireModule("promisify-stream"),
  tryDo = requireModule("try-do"),
  debug = require("debug")("clean"),
  throwIfNoFiles = requireModule("throw-if-no-files"),
  msbuild = require("gulp-msbuild"),
  dotnetClean = require("gulp-dotnet-cli").clean,
  resolveMasks = requireModule("resolve-masks"),
  env = requireModule("env");
const chalk = require("ansi-colors");

const myVars = [
  "BUILD_TOOLSVERSION",
  "BUILD_CONFIGURATION",
  "BUILD_VERBOSITY",
  "BUILD_MAX_CPU_COUNT",
  "BUILD_FAIL_ON_ERROR",
  "BUILD_PLATFORM",
  "BUILD_ARCHITECTURE",
  "BUILD_MSBUILD_NODE_REUSE",
  "BUILD_RETRIES"
];
env.associate(myVars, "clean");

gulp.task(
  "clean",
  "Invokes the 'Clean' target on all solutions in the tree",
  tryClean
);

function tryClean() {
  return tryDo(
    clean,
    "BUILD_RETRIES",
    e => console.error(chalk.red(`Clean fails: ${e}`))
  );
}

function clean() {
  const useDotNetCore = env.resolveFlag("DOTNET_CORE");
  if (useDotNetCore) {
    return cleanWithDotnet()
  } else {
    return cleanWithMsBuild();
  }
}

async function cleanWithDotnet() {
  const
    configuration = env.resolve("BUILD_CONFIGURATION"),
    slnMasks = resolveMasks("BUILD_INCLUDE", [ "BUILD_EXCLUDE", "BUILD_ADDITIONAL_EXCLUDE"]);
  debug({
    slnMasks,
    cwd: process.cwd()
  });
  const solutions = gulp
    .src(slnMasks, { allowEmpty: true })
    .pipe(throwIfNoFiles(`No solutions found matching masks: ${slnMasks}}`));
  await promisifyStream(
    solutions.pipe(
      dotnetClean({
        configuration
      })
    )
  );
}

function cleanWithMsBuild() {
  return promisifyStream(
    gulp.src("**/*.sln")
      .pipe(
        msbuild({
          toolsVersion: env.resolve("BUILD_TOOLSVERSION"),
          targets: [ "Clean" ],
          configuration: env.resolve("BUILD_CONFIGURATION"),
          stdout: true,
          logCommand: true,
          errorOnFail: env.resolveFlag("BUILD_FAIL_ON_ERROR"),
          solutionPlatform: env.resolve("BUILD_PLATFORM"),
          architecture: env.resolve("BUILD_ARCHITECTURE"),
          verbosity: env.resolve("BUILD_VERBOSITY"),
          nodeReuse: env.resolveFlag("BUILD_MSBUILD_NODE_REUSE"),
          maxcpucount: env.resolveNumber("BUILD_MAX_CPU_COUNT")
        })
      )
  );
}
