const gulp = requireModule("gulp"),
  path = require("path"),
  findTool = requireModule("testutil-finder").findTool,
  spawn = requireModule("spawn"),
  fs = requireModule("fs"),
  quoteIfRequired = requireModule("quote-if-required"),
  del = require("del"),
  env = requireModule("env");

env.associate(["COVERAGE_XML", "COVERAGE_REPORTING_EXCLUDE"], "cover-dotnet");

gulp.task(
  "default-report-generator",
  `Generates HTML reports from existing coverage XML reports`,
  () => {
    const reportGenerator = findTool("ReportGenerator.exe");
    if (!reportGenerator) {
      return Promise.reject("No ReportGenerator.exe found in tools folder");
    }
    const coverageXml = env.resolve("COVERAGE_XML");
    if (!fs.existsSync(coverageXml)) {
      return Promise.reject(`Can't find ${coverageXml}`);
    }

    var inclusions = env.resolveArray("COVERAGE_INCLUDE");
    const exclusions = env
      .resolveArray("COVERAGE_EXCLUDE")
      .concat(env.resolveArray("COVERAGE_ADDITIONAL_EXCLUDE"))
      .filter(e => inclusions.indexOf(e) === -1);
    const
      coverageExclude = exclusions.map(e => `-${e}`).join(";"),
      coverageInclude = inclusions.map(e => `+${e}`).join(";"),
      assemblyfilters = `${coverageInclude};${coverageExclude}`;


    return spawn(reportGenerator, [
      `-reports:${quoteIfRequired(coverageXml)}`,
      `-targetdir:${quoteIfRequired(path.join("buildreports", "coverage"))}`,
      `"-assemblyfilters:${assemblyfilters}"`
    ]);
  }
);

gulp.task("clean-reports", `Cleans out the build reports folder`, async () => {
  const buildReportsFolder = path.dirname(env.resolve("COVERAGE_XML")),
    exists = await fs.exists(buildReportsFolder);
  if (exists) {
    await del(buildReportsFolder);
  }
  await fs.mkdir(buildReportsFolder);
});
