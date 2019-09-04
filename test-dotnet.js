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
  multiSplit = requireModule("multi-split");

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

  const testMask = resolveTestMasks(),
    configuration = env.resolve("BUILD_CONFIGURATION"),
    dotnetTestProjects = resolveDotNetCoreTestProjects(testMask);

  const dotNetCore = env.resolveFlag("DOTNET_CORE");
  return dotNetCore
    ? testAsDotnetCore(dotnetTestProjects, configuration)
    : testWithNunitCli(configuration, testMask);
}

function resolveDotNetCoreTestProjects(masks) {
  return masks.map(p => {
    if (isPureMask(p)) {
      // have path spec, don't do magic!
      return extractPureMask(p);
    }
    if (p.indexOf("!") === 0) {
      p = p.substr(1);
      return `!**/**/${p}.csproj`;
    } else {
      return `**/${p}.csproj`;
    }
  });
}

function isPureMask(str) {
  return str && str[0] === "(" && str[str.length - 1] === ")";
}
function extractPureMask(str) {
  return str.substr(1, str.length - 2);
}

function dbg(o) {
  console.log(o);
  return o;
}
function testWithNunitCli(configuration, testMask) {
  const source = testMask.map(m => `${m}.dll`);
  let agents = parseInt(env.resolve("MAX_NUNIT_AGENTS"));
  if (isNaN(agents)) {
    agents = os.cpus().length - 1;
  }
  const seenAssemblies = [];
  const config = {
    executable: testUtilFinder.latestNUnit({
      architecture: env.resolve("NUNIT_ARCHITECTURE")
    }),
    options: {
      result: env.resolve("BUILD_REPORT_XML"),
      agents: agents,
      labels: env.resolve("NUNIT_LABELS")
    }
  };
  log.info(`Using NUnit runner at ${config.executable}`);
  log.info("Find files:", source);
  logConfig(config.options, {
    result: "Where to store test result (xml file)",
    agents: "Number of NUnit agents to engage",
    labels: "What labels NUnit should display as tests run"
  });
  return promisifyStream(
    gulp
      .src(source, {
        read: false
      })
      .pipe(
        filter(vinylFile => {
          const parts = multiSplit(vinylFile.path, ["/", "\\"]),
            isNetCore = !!(parts.filter(p => p.match(/^netcore/)).length),
            assemblyName = parts[parts.length-1].replace(/\.dll$/gi, ""),
            isPrimary = !!parts.slice(0, parts.length - 1)
                          .filter(p => p.toLowerCase() === assemblyName.toLowerCase())
                          .length;
            isBin = !!(parts.filter(p => p.match(/^bin$/i)).length),
            buildConfig = findBuildConfigFrom(parts),
            isDebug = buildConfig === "debug",
            isForConfig = buildConfig === configuration,
            isAny = (parts[parts.length - 1] || "").toLowerCase() === "bin",
            include = !isNetCore && isPrimary && (isDebug || isAny || isForConfig) ;
          debug({
            path: vinylFile.path,
            parts,
            buildConfig,
            isNetCore,
            isPrimary,
            isDebug,
            isAny,
            isForConfig,
            include
          });
          return include;
        })
      )
      .pipe(gulpDebug({ title: "before filter", logger: debug }))
      .pipe(filter(file => isDistinctFile(file.path, seenAssemblies)))
      .pipe(gulpDebug({ title: "after filter", logger: debug }))
      .pipe(nunit(config))
  );
}

function findBuildConfigFrom(pathParts) {
  const oneUp = pathParts[pathParts.length - 2];
  if (oneUp === undefined) {
    return "";
  }
  if (oneUp.match(/^net(standard\d\.\d|\d{3}|coreapp\d\.\d)$/)) {
    // one-up is a release target... travel one higher
    return pathParts[pathParts.length - 3] || "";
  }
  return oneUp;
}

function testAsDotnetCore(testProjects, configuration) {
  return promisifyStream(
    gulp.src(testProjects).pipe(
      test({
        verbosity: env.resolve("TEST_VERBOSITY"),
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
