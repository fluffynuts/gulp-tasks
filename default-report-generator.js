const
  gulp = requireModule("gulp-with-help"),
  path = require("path"),
  findTool = requireModule("testutil-finder").findTool,
  spawn = requireModule("spawn"),
  fs = requireModule("fs"),
  del = require("del"),
  defaultExclusions =
    "-" +
    [
      "*.Tests",
      "FluentMigrator",
      "FluentMigrator.Runner",
      "PeanutButter.*",
      "GenericBuilderTestArtifactBuilders",
      "GenericBuilderTestArtifactEntities"
    ].join(";-"),
  defaultReportsPath = path.join("buildreports", "coverage.xml"),
  buildReportsPath = process.env.COVERAGE_XML || defaultReportsPath,
  coverageExclude = process.env.COVERAGE_EXCLUDE || defaultExclusions,
  buildReportsFolder = path.dirname(buildReportsPath);

function findCoverageXml() {
  return fs.existsSync(buildReportsPath) ? buildReportsPath : null;
}

function quoteIfSpaced(str, q) {
  q = q || '"';
  return str.indexOf(" ") > -1 ? `${q}${str}${q}` : str;
}

gulp.task(
  "default-report-generator",
  `Generates HTML reports from existing coverage XML reports at ${buildReportsPath}`,
  () => {
    var reportGenerator = findTool("ReportGenerator.exe");
    if (!reportGenerator) {
      return Promise.reject("No ReportGenerator.exe found in tools folder");
    }
    var coverageXml = findCoverageXml();
    if (!coverageXml) {
      return Promise.reject("Can't find coverage.xml");
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
  `Cleans out the build reports folder ${buildReportsFolder}`, async () => {
    const exists = await fs.exists(buildReportsFolder);
    if (exists) {
      await del(buildReportsFolder);
    }
    await fs.mkdir(buildReportsFolder);
  });
