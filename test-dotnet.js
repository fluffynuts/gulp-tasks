const
  QUACKERS_LOG_PREFIX = "::",
  QUACKERS_SUMMARY_START = `::SS::`,
  QUACKERS_SUMMARY_COMPLETE = `::SC::`,
  QUACKERS_FAILURES_MARKER = `::SF::`,
  QUACKERS_FAILURE_INDEX_PLACEHOLDER = "::[#]::",
  quackersLogPrefixLength = QUACKERS_LOG_PREFIX.length,
  quackersFullSummaryStartMarker = `${QUACKERS_LOG_PREFIX}${QUACKERS_SUMMARY_START}`,
  quackersFullSummaryCompleteMarker = `${QUACKERS_LOG_PREFIX}${QUACKERS_SUMMARY_COMPLETE}`,
  { rm, ls, FsEntities, readTextFile } = require("yafs"),
  seed = requireModule("seed"),
  gulp = requireModule("gulp"),
  log = requireModule("log"),
  path = require("path"),
  gulpDebug = require("gulp-debug"),
  debug = require("debug")("test-dotnet"),
  filter = require("gulp-filter"),
  fs = require("fs"),
  chalk = requireModule("chalk"),
  promisifyStream = requireModule("promisify"),
  nunit = require("./modules/gulp-nunit-runner"),
  testUtilFinder = requireModule("testutil-finder"),
  env = requireModule("env"),
  resolveTestMasks = requireModule("resolve-test-masks"),
  logConfig = requireModule("log-config"),
  gatherPaths = requireModule("gather-paths"),
  { test } = requireModule("dotnet-cli"),
  { resolveTestPrefixFor } = requireModule("test-utils"),
  buildReportFolder = path.dirname(env.resolve("BUILD_REPORT_XML")),
  netFrameworkTestAssemblyFilter = requireModule("net-framework-test-assembly-filter");
const { baseName, chopExtension } = require("./modules/path-utils");

gulp.task(
  "test-dotnet",
  `Runs all tests in your solution via NUnit *`,
  [ "build" ],
  runTests
);

gulp.task(
  "quick-test-dotnet",
  `Tests whatever test assemblies have been recently built *`,
  runTests
);

const myTasks = [ "test-dotnet", "quick-test-dotnet" ],
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
    "TEST_VERBOSITY",
    "DOTNET_TEST_PARALLEL",
    "RETAIN_TEST_DIAGNOSTICS"
  ];
env.associate(myVars, myTasks);

async function runTests() {
  if (!fs.existsSync(buildReportFolder)) {
    fs.mkdirSync(buildReportFolder);
  }

  const dotNetCore = env.resolveFlag("DOTNET_CORE");
  const testMasks = resolveTestMasks(dotNetCore),
    configuration = env.resolve("BUILD_CONFIGURATION"),
    tester = dotNetCore
      ? testAsDotnetCore
      : testWithNunitCli;

  debug({
    tester,
    configuration,
    testMasks
  });
  try {
    await tester(configuration, testMasks);
  } finally {
    await removeTestDiagnostics();
  }
}

async function removeTestDiagnostics() {
  const agentLogs = await ls(".", {
    entities: FsEntities.files,
    match: /nunit-agent.*\.log$/,
    fullPaths: true
  });
  const internalTraces = await ls(".", {
    entities: FsEntities.files,
    match: /InternalTrace.*\.log/,
    fullPaths: true
  });

  for (const f of agentLogs.concat(internalTraces)) {
    debug(`delete test diagnostic: ${f}`);
    await rm(f);
  }
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
    labels: "What labels NUnit should display as tests run",
    agents: "How many NUnit agents to run"
  };
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

async function testAsDotnetCore(configuration, testProjects) {
  const
    sleep = requireModule("sleep"),
    testResults = {
      quackersEnabled: false,
      passed: 0,
      failed: 0,
      skipped: 0,
      failureSummary: [],
      started: Date.now()
    },
    testProcessResults = [],
    testProjectPaths = await gatherPaths(testProjects, true),
    verbosity = env.resolve("BUILD_VERBOSITY"),
    parallelVar = "DOTNET_TEST_PARALLEL";
  let testInParallel = env.resolveFlag(parallelVar);
  if (process.env[parallelVar] === undefined) {
    testInParallel = testProjectPaths.reduce(
      (acc, cur) => acc && projectReferencesQuackers(cur),
      true
    );
    if (testInParallel) {
      debug(`parallel testing automatically enabled: all test projects use Quackers!`);
    }
  }

  const concurrency = testInParallel
      ? env.resolveNumber("MAX_CONCURRENCY")
      : 1,
    chains = seed(concurrency).map(async (value, index) => {
      // stagger the startups
      await sleep(index * 1000);
      return Promise.resolve();
    });

  console.log(`Will run tests for project${testProjectPaths.length === 1 ? "" : "s"}:`);
  for (const projectPath of testProjectPaths) {
    console.log(`  ${projectPath}`);
  }

  let p, current = 0;
  while (p = testProjectPaths.shift()) {
    const
      idx = current++ % concurrency,
      target = p;
    chains[idx] = chains[idx].then(async () => {
      debug(`${idx}  start test run: ${target}`);
      const result = await testOneProject(target, configuration, verbosity, testResults, true);
      testProcessResults.push(result);
      return result;
    });
  }
  await Promise.all(chains);

  if (testResults.quackersEnabled) {
    logOverallResults(testResults);
  } else {
    console.log("If you install Quackers.TestLogger into your test projects, you'll get a lot more info here!");
  }
  throwIfAnyFailed(testProcessResults);
}

function throwIfAnyFailed(testProcessResults) {
  const allErrors = [];
  let haveGenericWarning = false;
  for (const result of testProcessResults) {
    if (!result) {
      continue;
    }
    if (result.exitCode === undefined) {
      continue;
    }
    if (!!result.exitCode) {
      const errors = (result.stderr || []);
      if (errors.length === 0) {
        if (!haveGenericWarning) {
          allErrors.push("One or more tests failed");
          haveGenericWarning = true;
        }
      } else {
        allErrors.push(errors.join("\n"));
      }
    }
  }
  if (allErrors.length) {
    throw new Error(`One or more test runs failed:\n\t${allErrors.join("\n\t")}`);
  }
}

function logOverallResults(testResults) {
  const
    total = testResults.passed + testResults.skipped + testResults.failed,
    now = Date.now(),
    runTimeMs = now - testResults.started,
    runTime = nunitLikeTime(runTimeMs),
    darkerThemeSelected = (process.env["QUACKERS_THEME"] || "").toLowerCase() === "darker",
    yellow = darkerThemeSelected
      ? chalk.yellow.bind(chalk)
      : chalk.yellowBright.bind(chalk),
    red = darkerThemeSelected
      ? chalk.red.bind(chalk)
      : chalk.redBright.bind(chalk);
  console.log(yellow(`
Test Run Summary
  Overall result: ${overallResultFor(testResults)}
  Test Count: ${total}, Passed: ${testResults.passed}, Failed: ${testResults.failed}, Skipped: ${testResults.skipped}
  Start time: ${dateString(testResults.started)}
    End time: ${dateString(now)}
    Duration: ${runTime}
`));
  if (testResults.failureSummary.length == 0) {
    return;
  }
  console.log(`\n${red("Failures:")}`);
  let
    blankLines = 0,
    failIndex = 1;
  for (let line of testResults.failureSummary) {
    line = line.trim();
    if (!line) {
      blankLines++;
    } else {
      blankLines = 0;
    }
    if (blankLines > 1) {
      continue;
    }
    const substituted = line.replace(QUACKERS_FAILURE_INDEX_PLACEHOLDER, `[${failIndex}]`);
    if (substituted !== line) {
      failIndex++;
    }
    console.log(substituted);
  }
  console.log("\n");
}

function dateString(ms) {
  return new Date(ms).toISOString().replace(/T/, " ");
}

function overallResultFor(testResults) {
  if (testResults.failed) {
    return "Failed";
  }
  if (testResults.skipped) {
    return "Warning";
  }
  return "Passed";
}

function nunitLikeTime(totalMs) {
  const
    ms = totalMs % 1000,
    seconds = Math.floor(totalMs / 1000);
  return `${seconds}.${ms} seconds`;
}

async function testOneProject(
  target,
  configuration,
  verbosity,
  testResults,
  runningInParallel
) {
  const
    quackersState = {
      inSummary: false, // gather summary info into test results
      inFailureSummary: false,
      // there is some valid logging (eg build) before the first quackers log
      // -> suppress when running in parallel (and by default when sequential)
      haveSeenQuackersLog: runningInParallel || env.resolveFlag("DOTNET_TEST_QUIET_QUACKERS"),
      testResults,
      target
    };
  const
    useQuackers = await projectReferencesQuackers(target),
    stderr = useQuackers
      ? s => {
        console.error(s);
      }
      : undefined,
    stdout = useQuackers
      ? quackersStdOutHandler.bind(null, quackersState)
      : undefined,
    loggers = useQuackers
      ? generateQuackersLoggerConfig(target)
      : generateBuiltinConsoleLoggerConfig();
  addTrxLoggerTo(loggers, target);
  testResults.quackersEnabled = testResults.quackersEnabled || useQuackers;
  return await test({
    target,
    verbosity,
    configuration,
    noBuild: true,
    msbuildProperties: env.resolveMap("MSBUILD_PROPERTIES"),
    loggers,
    stderr,
    stdout,
    suppressErrors: true // we want to collect the errors later, not die when one happens
  });
}

function addTrxLoggerTo(loggers, target) {
  const
    proj = baseName(target),
    projName = chopExtension(proj),
    logFileName = path.resolve(path.join(buildReportFolder, `${projName}.trx`));
  loggers.trx = {
    logFileName
  };
}

function quackersStdOutHandler(state, s) {
  s = s || "";
  if (s.startsWith(quackersFullSummaryStartMarker)) {
    state.inSummary = true;
    return;
  }
  if (s.startsWith(quackersFullSummaryCompleteMarker)) {
    state.inSummary = false;
    return;
  }
  if (state.inSummary) {
    /* actual summary log example
::quackers log::::start summary::
::quackers log::
::quackers log::Test results:
::quackers log::Passed:  8
::quackers log::Failed:  2
::quackers log::Skipped: 1
::quackers log::Total:   11

::quackers log::Failures:

::quackers log::[1] QuackersTestHost.SomeTests.ShouldBeLessThan50(75)
::quackers log::  NExpect.Exceptions.UnmetExpectationException : Expected 75 to be less than 50
::quackers log::     at QuackersTestHost.SomeTests.ShouldBeLessThan50(Int32 value) in C:\code\opensource\quackers\src\Demo\SomeTests.cs:line 66
::quackers log::

::quackers log::[2] QuackersTestHost.SomeTests.ShouldFail
::quackers log::  NExpect.Exceptions.UnmetExpectationException : Expected false but got true
::quackers log::     at QuackersTestHost.SomeTests.ShouldFail() in C:\code\opensource\quackers\src\Demo\SomeTests.cs:line 28
::quackers log::
::quackers log::::end summary::
     */
    const line = stripQuackersLogPrefix(s);
    if (line.startsWith(QUACKERS_FAILURES_MARKER)) {
      state.inFailureSummary = true;
      return;
    }
    if (state.inFailureSummary) {
      state.testResults.failureSummary.push(line);
      return;
    }
    incrementTestResultCount(state.testResults, line);
    return;
  }
  const isQuackersLog = s.startsWith(QUACKERS_LOG_PREFIX);
  if (isQuackersLog) {
    state.haveSeenQuackersLog = true;
  }
  if (!state.haveSeenQuackersLog || isQuackersLog) {
    console.log(stripQuackersLogPrefix(s));
  } else {
    debug(`discarding log: "${s}"`);
  }
}

function incrementTestResultCount(testResults, line) {
  const
    parts = line.split(":").map(p => p.trim().toLowerCase()),
    numericPart = line.match(/\d+/) || [ "0" ],
    count = parseInt(numericPart[0]);
  switch (parts[0]) {
    case "passed":
      testResults.passed += count;
      return;
    case "failed":
      testResults.failed += count;
      return;
    case "skipped":
      testResults.skipped += count;
      return;
  }
}

function stripQuackersLogPrefix(line) {
  return line.substring(quackersLogPrefixLength);
}

const quackersRefCache = {};

async function projectReferencesQuackers(csproj) {
  if (quackersRefCache[csproj] !== undefined) {
    return quackersRefCache[csproj];
  }
  const
    contents = await readTextFile(csproj),
    lines = contents.split("\n").map(l => l.trim());
  for (const line of lines) {
    if (line.match(/<PackageReference Include="Quackers.TestLogger"/)) {
      return quackersRefCache[csproj] = true;
    }
    if (line.match(/<ProjectReference Include=.*Quackers.TestLogger.csproj"/)) {
      return quackersRefCache[csproj] = true;
    }
  }
  return quackersRefCache[csproj] = false;
}

function generateBuiltinConsoleLoggerConfig() {
  return {
    console: {
      verbosity: env.resolve("TEST_VERBOSITY")
    }
  };
}

function generateQuackersLoggerConfig(target) {
  const quackers = {
    logprefix: QUACKERS_LOG_PREFIX,
    summaryStartMarker: QUACKERS_SUMMARY_START,
    summaryCompleteMarker: QUACKERS_SUMMARY_COMPLETE,
    failureStartMarker: QUACKERS_FAILURES_MARKER,
    verboseSummary: "true",
    outputFailuresInline: "true",
    failureIndexPlaceholder: QUACKERS_FAILURE_INDEX_PLACEHOLDER
  };
  const prefix = resolveTestPrefixFor(target);
  if (prefix) {
    quackers.testNamePrefix = prefix;
  }
  // quackers also accepts env vars, but the ones we're setting here
  // are kinda required for zarro to operate as expected; fortunately,
  // cli args supercede env vars in quackers' world
  return {
    quackers
  };
}

function isDistinctFile(filePath, seenFiles) {
  const basename = path.basename(filePath),
    result = seenFiles.indexOf(basename) === -1;
  if (result) {
    seenFiles.push(basename);
  }
  return result;
}
