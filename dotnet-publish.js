const
  { publish } = require("gulp-dotnet-cli"),
  gulp = requireModule("gulp-with-help")

gulp.task("dotnet-publish",
  "Performs `dotnet publish` on all non-test projects in the tree",
  () => {
    return gulp.src([
      "**/*.csproj",
      "!**/Test.csproj",
      "!**/*.Test.csproj",
      "!**/*.Tests.csproj"
    ])
    .pipe(publish({
      configuration: process.env.BUILD_CONFIGURATION || "Release"
    }));
 });
