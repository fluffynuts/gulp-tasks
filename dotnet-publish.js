const { publish } = require("gulp-dotnet-cli"),
  env = requireModule("env"),
  gulp = requireModule("gulp-with-help");

gulp.task(
  "dotnet-publish",
  "Performs `dotnet publish` on all non-test projects in the tree",
  () => {
    var publishOpts = {
      configuration: env.resolve("PUBLISH_BUILD_CONFIGURATION"),
    };
    const publishRuntimes = env.resolve("DOTNET_PUBLISH_RUNTIMES");
    if (publishRuntimes) {
      publishOpts.runtime = publishRuntimes
    }
    const testInclusionsInverted = env.resolveArray("TEST_INCLUDE")
    .map(p => `!${p}.csproj`)
    return gulp
      .src(["**/*.csproj"].concat(testInclusionsInverted))
      .pipe(
        publish(publishOpts)
      );
  }
);
