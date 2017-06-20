var gulp = requireModule("gulp-with-help"),
  fs = require("fs"),
  nunit = require("gulp-nunit-runner"),
  testUtilFinder = requireModule("testutil-finder");

gulp.task("test-dotnet",
  "Runs all tests in your solution via NUnit",
  [ "build" ],
  function () {
  if (!fs.existsSync("buildreports")) {
    fs.mkdir("buildreports");
  }
  return gulp.src([
    "**/bin/Debug/**/*.Tests.dll",
    "**/bin/*.Tests.dll",
    "./tools/**/*.sln"
  ], { read: false }).pipe(nunit({
    executable: testUtilFinder.latestNUnit({ architecture: "x86" }),
    options: {
      result: "buildreports/nunit-result.xml"
    }
  }));
});

