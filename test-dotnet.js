const gulp = requireModule("gulp-with-help"),
  log = requireModule("log"),
  path = require("path"),
  gulpDebug = require("gulp-debug"),
  debug = require("debug")("test-dotnet"),
  filter = require("gulp-filter"),
  fs = require("fs"),
  promisifyStream = requireModule("promisify"),
  os = require("os"),
  { test } = require("gulp-dotnet-cli"),
  nunit = require("gulp-nunit-runner"),
  testUtilFinder = requireModule("testutil-finder"),
  env = requireModule("env"),
  resolveTestMasks = requireModule("resolve-test-masks"),
  logConfig = requireModule("log-config"),
  netFrameworkTestAssemblyFilter = requireModule("net-framework-test-assembly-filter");

gulp.task(
  "test-dotnet",
  `Runs all tests in your solution via NUnit *`,
  ["build"],
  runTests
);

gulp.task(
  "quick-test-dotnet",
  `Tests whatever test assemblies have been recently built *`,
  runTests
);

const myTasks = ["test-dotnet", "quick-test-dotnet"],
  myVars = [
    "BUILD_CONFIGURATION",
    "DOTNET_CORE",
    "TEST_INCLUDE",
    "TEST_EXCLUDE",
    "MAX_NUNIT_AGENTS",
    "MAX_CONCURRENCY",
    "BUILD_REPORT_XML",
    "NUNIT_ARCHITECTURE",
    "NUNIT_LABELS",
    "TEST_VERBOSITY"
  ];
env.associate(myVars, myTasks);

async function runTests() {
  const buildReportFolder = path.dirname(env.resolve("BUILD_REPORT_XML"));
  if (!fs.existsSync(buildReportFolder)) {
    fs.mkdirSync(buildReportFolder);
  }

  const dotNetCore = env.resolveFlag("DOTNET_CORE");
  const testMasks = resolveTestMasks(dotNetCore),
    configuration = env.resolve("BUILD_CONFIGURATION"),
    tester = dotNetCore ? testAsDotnetCore : testWithNunitCli;

  debug({
    tester,
    configuration,
    testMasks
  });
  return tester(configuration, testMasks);
}

function consolidatePathEnvVar() {
  const keys = Object.keys(process.env)
    .filter(k => k.toLowerCase() === "path");
  if (keys.length === 1) {
    return;
  }
  const sep = process.platform === "win32"
    ? ";"
    : ":";
  const include = [];
  keys.forEach(k => {
    const parts = process.env[k].split(sep);
    parts.forEach(p => {
      if (include.indexOf(p) === -1) {
        include.push(p);
      }
    });
  });
  keys.forEach(k => process.env[k] = "");
  process.env.PATH = include.join(sep);
}

function testWithNunitCli(configuration, source) {
  consolidatePathEnvVar();
  const agents = env.resolveNumber("MAX_NUNIT_AGENTS");
  const seenAssemblies = [];
  const config = {
    executable: testUtilFinder.latestNUnit({
      architecture: env.resolve("NUNIT_ARCHITECTURE")
    }),
    options: {
      result: env.resolve("BUILD_REPORT_XML"),
      agents: agents,
      labels: env.resolve("NUNIT_LABELS"),
    }
  };
  const nunitProcess = env.resolve("NUNIT_PROCESS");
  const logInfo = {
    result: "Where to store test result (xml file)",
    agents: "Number of NUnit agents to engage",
    labels: "What labels NUnit should display as tests run",
    agents: "How many NUnit agents to run"
  }
  if (nunitProcess !== "auto") {
    config.options.process = nunitProcess;
    logInfo.process = "Process model for NUnit";
  }
  log.info(`Using NUnit runner at ${config.executable}`);
  log.info("Find files:", source);
  logConfig(config.options, logInfo);
  debug({
    config
  });
  return promisifyStream(
    gulp
      .src(source, {
        read: false
      })
      .pipe(
        filter(netFrameworkTestAssemblyFilter(configuration))
      )
      .pipe(gulpDebug({ title: "before filter", logger: debug }))
      .pipe(filter(file => isDistinctFile(file.path, seenAssemblies)))
      .pipe(gulpDebug({ title: "after filter", logger: debug }))
      .pipe(nunit(config))
  );
}

function testAsDotnetCore(configuration, testProjects) {
  // TODO: collect all projects in an array and then
  //  run test projects in parallel, throttled by MAX_CONCURRENCY
  return promisifyStream(
    gulp.src(testProjects).pipe(
      test({
        verbosity: env.resolve("TEST_VERBOSITY"),
        configuration,
        noBuild: true
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
