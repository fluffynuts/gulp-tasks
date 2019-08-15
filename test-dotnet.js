const gulp = requireModule("gulp-with-help"),
  path = require("path"),
  gulpDebug = require("gulp-debug"),
  debug = require("debug")("test-dotnet"),
  filter = require("gulp-filter"),
  fs = require("fs"),
  areAllDotnetCore = requireModule("are-all-dotnet-core"),
  promisifyStream = requireModule("promisify"),
  os = require("os"),
  { test } = require("gulp-dotnet-cli"),
  nunit = require("gulp-nunit-runner"),
  getToolsFolder = requireModule("get-tools-folder"),
  testUtilFinder = requireModule("testutil-finder"),
  envHelpGenerator = requireModule("generate-env-help-for"),
  envHelp = envHelpGenerator({
    "BUILD_CONFIGURATION": "Built configuration to use for testing",
    "MAX_NUNIT_AGENTS": "",
    "NUNIT_ARCHITECTURE": "",
    "BUILD_REPORT_XML": "",
    "NUNIT_LABELS": ""
  });

gulp.task(
  "test-dotnet",
  `Runs all tests in your solution via NUnit\n${envHelp}`,
  ["build"],
  async () => runTests()
);

gulp.task(
  "quick-test-dotnet",
  `Tests whatever test assemblies have been recently built\n${envHelp}`,
  async () => runTests()
);

async function runTests() {
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
  const configuration = process.env.BUILD_CONFIGURATION || "Debug";
  if (await areAllDotnetCore(projects)) {
    return testAsDotnetCore(projects, configuration);
  }
  return testWithNunitCli(configuration);
}

function testWithNunitCli(configuration) {
  let agents = parseInt(process.env.MAX_NUNIT_AGENTS);
  if (isNaN(agents)) {
    agents = os.cpus().length - 1;
  }
  const seenAssemblies = [];
  return promisifyStream(
    gulp
      .src([`**/bin/${configuration}/**/*.Tests.dll`, `**/bin/*.Tests.dll`], {
        read: false
      })
      .pipe(gulpDebug({ title: "before filter", logger: debug }))
      .pipe(filter(file => isDistinctFile(file.path, seenAssemblies)))
      .pipe(gulpDebug({ title: "after filter", logger: debug }))
      .pipe(
        nunit({
          executable: testUtilFinder.latestNUnit({ architecture: process.env.NUNIT_ARCHITECTURE || "x86" }),
          options: {
            result: process.env.BUILD_REPORT_XML || "buildreports/nunit-result.xml",
            agents: agents,
            labels: process.env.NUNIT_LABELS || "All"
          }
        })
      )
  );
}

function testAsDotnetCore(projects, configuration) {
    return promisifyStream(
      gulp.src(projects).pipe(
        test({
          verbosity: "normal",
          configuration
        })
      )
    );
}

function isDistinctFile(filePath, seenFiles) {
  const basename = path.basename(filePath),
    result = seenFiles.indexOf(basename) === -1;
  if (result) {
    seenFiles.push(basename);
  }
  return result;
}
