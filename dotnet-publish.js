const { publish } = require("gulp-dotnet-cli"),
  gulp = requireModule("gulp-with-help");

gulp.task(
  "dotnet-publish",
  "Performs `dotnet publish` on all non-test projects in the tree",
  () => {
    var publishOpts = {
      configuration: process.env.BUILD_CONFIGURATION || "Release"
    };
    if (process.env.DOTNET_PUBLISH_RUNTIMES) {
      publishOpts.runtime = process.env.DOTNET_PUBLISH_RUNTIMES
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
