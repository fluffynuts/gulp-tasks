const
  gulp = requireModule("gulp-with-help"),
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
  env = requireModule("env"),
  testTasks = ["test-dotnet", "quick-test-todtnet"],
  buildAndTestTasks = ["build"].concat(testTasks),
  multiSplit = requireModule("multi-split");

// env.register("BUILD_CONFIGURATION", "Debug", "Configuration used for building / testing", [ "build "].concat(testTasks));
env.register({
  name: "BUILD_CONFIGURATION",
  default: "Debug",
  help: "Configuration used for building / testing",
  tasks: buildAndTestTasks
});
env.register({
  name: "BUILD_PLATFORM",
  default: "Any CPU",
  help: "Build output platform",
  tasks: buildAndTestTasks
});
env.register({
  name: "BUILD_ARCHITECTURE",
  default: "x64",
  help: "Target archtecture of build",
  tasks: buildAndTestTasks
});
env.register({
  name: "MAX_NUNIT_AGENTS",
  default: "(auto)",
  help: "How many NUNit agents to use for testing (net framework)",
  tasks: testTasks
});
env.register({
  name: "NUNIT_ARCHITECTURE",
  default: "(auto)",
  tasks: testTasks
});
env.register({
  name: "BUILD_REPORT_XML",
  default: "buildreports/nunit-result.xml",
  tasks: testTasks
});
env.register({
  name: "NUNIT_LABELS",
  default: "All",
  tasks: testTasks
});
const extra = "\n - globs match dotnet core projects or .net framework built assemblies\n- elements surrounded with () are treated as pure gulp.src masks";
env.register({
  name: "TEST_INCLUDE",
  help:
    `comma-separated list of test projects to match${extra}`,
  default: "*.Tests,*.Tests.*,Tests,Test,Test.*"
});
env.register({
  name: "TEST_EXCLUDE",
  help: `comma-separated list of exclusions for tests${extra}`,
  default: `(!**/node_modules/**/*),(!./${getToolsFolder()}/**/*)`
});
env.register({
  name: "TEST_VERBOSITY",
  help: "Verbosity of reporting for dotnet core testing",
  default: "normal"
});

function explode(masks) {
  return masks
    .split(",")
    .map(p => p.trim())
    .filter(p => !!p);
}

function runTests() {
  const buildReportFolder = path.dirname(env.resolve("BUILD_REPORT_XML"));
  if (!fs.existsSync(buildReportFolder)) {
    fs.mkdirSync(buildReportFolder);
  }

  const
    include = env.resolve("TEST_INCLUDE"),
    exclude = env.resolve("TEST_EXCLUDE"),
    testMask = explode(exclude).concat(explode(include));
  const
    configuration = env.resolve("BUILD_CONFIGURATION"),
    dotnetTestProjects = resolveDotNetCoreTestProjects(testMask);

  // if (await areAllDotnetCore(dotnetTestProjects)) {
  //   return testAsDotnetCore(dotnetTestProjects, configuration);
  // }
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
        return `!**/**/${p}.csproj`
      } else {
        return `**/${p}.csproj`
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
        return [ extractPureMask(p) ];
      }
      if (p.indexOf("!") === 0) {
        p = p.substr(1);
        return [
          `!**/bin/${configuration}/**/${p}.dll`,
          `!**/bin/${p}.dll`
        ];
      } else {
        return [
          `**/bin/${configuration}/**/${p}.dll`,
          `**/bin/${p}.dll`
        ];
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
      .pipe(filter(vinylFile => {
        const
          parts = multiSplit(vinylFile.path, [ "/", "\\" ]),
          matches = parts.filter(p => p.match(/^netcore/));
        return !matches.length;
      }))
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

gulp.task(
  "test-dotnet",
  `Runs all tests in your solution via NUnit *`,
  ["build"],
  () => runTests()
);

gulp.task(
  "quick-test-dotnet",
  `Tests whatever test assemblies have been recently built *`,
  () => runTests()
);
