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
  testUtilFinder = requireModule("testutil-finder"),
  env = requireModule("env"),
  resolveTestMasks = requireModule("resolve-test-masks"),
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
    "TEST_INCLUDE",
    "TEST_EXCLUDE",
    "MAX_NUNIT_AGENTS",
    "BUILD_REPORT_XML",
    "NUNIT_ARCHITECTURE",
    "NUNIT_LABELS",
    "TEST_VERBOSITY"
  ];
env.associate(myVars, myTasks);

function explode(masks) {
  return masks
    .split(",")
    .map(p => p.trim())
    .filter(p => !!p);
}

async function runTests() {
  const buildReportFolder = path.dirname(env.resolve("BUILD_REPORT_XML"));
  if (!fs.existsSync(buildReportFolder)) {
    fs.mkdirSync(buildReportFolder);
  }

  const testMask = resolveTestMasks(),
    configuration = env.resolve("BUILD_CONFIGURATION"),
    dotnetTestProjects = resolveDotNetCoreTestProjects(testMask);

  if (await areAllDotnetCore(dotnetTestProjects)) {
    return testAsDotnetCore(dotnetTestProjects, configuration);
  }
  return testWithNunitCli(configuration, testMask);
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

function testWithNunitCli(configuration, testMasks) {
  const source = testMasks
    .map(p => {
      if (isPureMask(p)) {
        // have path spec, don't do magic!
        return [extractPureMask(p)];
      }
      if (p.indexOf("!") === 0) {
        p = p.substr(1);
        return [`!**/bin/${configuration}/**/${p}.dll`, `!**/bin/${p}.dll`];
      } else {
        return [`**/bin/${configuration}/**/${p}.dll`, `**/bin/${p}.dll`];
      }
    })
    .reduce((acc, cur) => acc.concat(cur), []);
  let agents = parseInt(env.resolve("MAX_NUNIT_AGENTS"));
  if (isNaN(agents)) {
    agents = os.cpus().length - 1;
  }
  const seenAssemblies = [];
  return promisifyStream(
    gulp
      .src(source, {
        read: false
      })
      .pipe(
        filter(vinylFile => {
          const parts = multiSplit(vinylFile.path, ["/", "\\"]),
            matches = parts.filter(p => p.match(/^netcore/));
          return !matches.length;
        })
      )
      .pipe(gulpDebug({ title: "before filter", logger: debug }))
      .pipe(filter(file => isDistinctFile(file.path, seenAssemblies)))
      .pipe(gulpDebug({ title: "after filter", logger: debug }))
      .pipe(
        nunit({
          executable: testUtilFinder.latestNUnit({
            architecture: env.resolve("NUNIT_ARCHITECTURE")
          }),
          options: {
            result: env.resolve("BUILD_REPORT_XML"),
            agents: agents,
            labels: env.resolve("NUNIT_LABELS")
          }
        })
      )
  );
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
