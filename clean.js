const gulp = requireModule("gulp"),
  msbuild = require("gulp-msbuild"),
  env = requireModule("env");

const myVars = [
  "BUILD_TOOLSVERSION",
  "BUILD_CONFIGURATION",
  "BUILD_VERBOSITY",
  "BUILD_MAX_CPU_COUNT",
  "BUILD_FAIL_ON_ERROR",
  "BUILD_PLATFORM",
  "BUILD_ARCHITECTURE",
  "BUILD_MSBUILD_NODE_REUSE"
];
env.associate(myVars, "clean");

gulp.task(
  "clean",
  "Invokes the 'Clean' target on all solutions in the tree",
  function() {
    return gulp.src("**/*.sln").pipe(
      msbuild({
        toolsVersion: env.resolve("BUILD_TOOLSVERSION"),
        targets: ["Clean"],
        configuration: env.resolve("BUILD_CONFIGURATION"),
        stdout: true,
        logCommand: true,
        errorOnFail: env.resolveFlag("BUILD_FAIL_ON_ERROR"),
        solutionPlatfor: env.resolve("BUILD_PLATFORM"),
        architecture: env.resolve("BUILD_ARCHITECTURE"),
        verbosity: env.resolve("BUILD_VERBOSITY"),
        nodeReuse: env.resolveFlag("BUILD_MSBUILD_NODE_REUSE"),
        maxcpucount: env.resolveNumber("BUILD_MAX_CPU_COUNT")
      })
    );
  }
);
