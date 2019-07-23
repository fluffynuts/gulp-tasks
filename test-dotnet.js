var gulp = requireModule("gulp-with-help"),
  fs = require("fs"),
  areAllDotnetCore = requireModule("are-all-dotnet-core"),
  promisifyStream = requireModule("promisify"),
  os = require("os"),
  { test } = require("gulp-dotnet-cli"),
  nunit = require("gulp-nunit-runner"),
  getToolsFolder = requireModule("get-tools-folder"),
  testUtilFinder = requireModule("testutil-finder");

gulp.task(
  "test-dotnet",
  "Runs all tests in your solution via NUnit",
  ["build"],
  async () => {
    if (!fs.existsSync("buildreports")) {
      fs.mkdirSync("buildreports");
    }

    const projects = [
      "**/*.Tests.csproj",
      "**/Tests.csproj",
      "**/Test.csproj",
      "**/*.Tests.*.csproj",
      "!**/node_modules/**/*.csproj",
      `!./${getToolsFolder}/**/*.csproj`
    ];
    if (await areAllDotnetCore(projects)) {
      return promisifyStream(
        gulp.src(projects).pipe(
          test({
            verbosity: "normal",
            configuration: process.env.BUILD_CONFIGURATION || "Debug"
          })
        )
      );
    }

    var agents = parseInt(process.env.MAX_NUNIT_AGENTS);
    if (isNaN(agents)) {
      agents = os.cpus().length - 1;
    }
    return promisifyStream(
      gulp
        .src(["**/bin/Debug/**/*.Tests.dll", "**/bin/*.Tests.dll"], {
          read: false
        })
        .pipe(
          nunit({
            executable: testUtilFinder.latestNUnit({ architecture: "x86" }),
            options: {
              result: "buildreports/nunit-result.xml",
              agents: agents,
              labels: "All"
            }
          })
        )
    );
  }
);
