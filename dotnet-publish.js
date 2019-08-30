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
    return gulp
      .src([
        "**/*.csproj",
        "!**/Test.csproj",
        "!**/*.Test.csproj",
        "!**/*.Tests.csproj"
      ])
      .pipe(
        publish(publishOpts)
      );
  }
);
