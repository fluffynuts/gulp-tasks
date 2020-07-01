const gulp = requireModule("gulp"),
  msbuild = require("gulp-msbuild"),
  env = requireModule("env");

const myVars = ["BUILD_TOOLSVERSION", "BUILD_CONFIGURATION", "BUILD_VERBOSITY"];
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
        verbosity: env.resolve("BUILD_VERBOSITY")
      })
    );
  }
);
