const gulp = requireModule("gulp-with-help"),
  path = require("path"),
  findTool = requireModule("testutil-finder").findTool,
  spawn = requireModule("spawn"),
  fs = requireModule("fs"),
  del = require("del"),
  env = requireModule("env");

env.associate(["COVERAGE_XML", "COVERAGE_REPORTING_EXCLUDE"], "cover-dotnet");

function quoteIfSpaced(str, q) {
  q = q || '"';
  return str.indexOf(" ") > -1 ? `${q}${str}${q}` : str;
}

gulp.task(
  "default-report-generator",
  `Generates HTML reports from existing coverage XML reports`,
  () => {
    var reportGenerator = findTool("ReportGenerator.exe");
    if (!reportGenerator) {
      return Promise.reject("No ReportGenerator.exe found in tools folder");
    }
    var coverageXml = env.resolve("COVERAGE_XML");
    if (!fs.existsSync(coverageXml)) {
      return Promise.reject(`Can't find ${coverageXml}`);
    }
    return spawn(reportGenerator, [
      `-reports:${quoteIfSpaced(coverageXml)}`,
      `-targetdir:${quoteIfSpaced(path.join("buildreports", "coverage"))}`,
      `"-assemblyfilters:${coverageExclude}"`
    ]);
  }
);

gulp.task(
  "clean-reports",
  `Cleans out the build reports folder`,
  async () => {
    const
      buildReportsFolder = path.dirname(env.resolve("COVERAGE_XML")),
      exists = await fs.exists(buildReportsFolder);
    if (exists) {
      await del(buildReportsFolder);
    }
    await fs.mkdir(buildReportsFolder);
  }
);
