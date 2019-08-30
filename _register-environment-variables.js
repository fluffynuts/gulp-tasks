const debug = require("debug")("register env vars"),
  path = require("path"),
  env = requireModule("env"),
  getToolsFolder = requireModule("get-tools-folder");

debug("-- start env var registration --");

env.register({
  name: "BUILD_CONFIGURATION",
  default: "Debug",
  help: "Configuration used for building / testing"
});

env.register({
  name: "BUILD_PLATFORM",
  default: "Any CPU",
  help: "Build output platform"
});

env.register({
  name: "BUILD_ARCHITECTURE",
  default: "x64",
  help: "Target architecture of build"
});

env.register({
  name: "MAX_NUNIT_AGENTS",
  default: "(auto)",
  help: "How many NUNit agents to use for testing (net framework)"
});

env.register({
  name: "NUNIT_ARCHITECTURE",
  default: "(auto)"
});

env.register({
  name: "BUILD_REPORT_XML",
  default: "buildreports/nunit-result.xml"
});

env.register({
  name: "NUNIT_LABELS",
  default: "All"
});

const extra = `
   - globs match dotnet core projects or .net framework built assemblies
   - elements surrounded with () are treated as pure gulp.src masks`,
  defaultTestInclude = "*.Tests,*.Tests.*,Tests,Test,Test.*",
  defaultTestExclude = `(!**/node_modules/**/*),(!./${getToolsFolder()}/**/*)`;
env.register({
  name: "TEST_INCLUDE",
  help: `comma-separated list of test projects to match${extra}`,
  default: defaultTestInclude
});

env.register({
  name: "TEST_EXCLUDE",
  help: `comma-separated list of exclusions for tests${extra}`,
  default: defaultTestExclude
});

env.register({
  name: "TEST_VERBOSITY",
  help: "Verbosity of reporting for dotnet core testing",
  default: "normal"
});

env.register({
  name: "BUILD_TOOLSVERSION",
  help: "Tools Version to pass to msbuild for building with",
  default: "auto"
});

env.register({
  name: "BUILD_TARGETS",
  help: "Targets to invoke msbuild with",
  default: "Clean,Build"
});

env.register({
  name: "BUILD_VERBOSITY",
  help: "Verbosity of reporting for msbuild building",
  default: "minimal"
});

const defaultCoverageExclusions =
  "FluentMigrator.*,PeanutButter.*,AutoMapper,AutoMapper.*,*.Tests.*";
env.register({
  name: "COVERAGE_EXCLUDE",
  help: "Exclusion masks to pass to coverage tool (overwrites defaults)",
  default: defaultCoverageExclusions
});

env.register({
  name: "COVERAGE_ADDITIONAL_EXCLUDE",
  help: "Exclusion masks to add to the defaults"
});

env.register({
  name: "COVERAGE_INCLUDE_ASSEMBLIES",
  help: ".NET assemblies to include in coverage testing",
  default: defaultTestInclude
});

env.register({
  name: "COVERAGE_EXCLUDE_ASSEMBLIES",
  help: ".NET assemblies to exclude in coverage testing",
  default: defaultTestInclude
});

const defaultReportsPath = path.join("buildreports", "coverage.xml");
env.register({
  name: "COVERAGE_XML",
  default: defaultReportsPath,
  help: "Path to coverage XML output"
});

const defaultCoverageReportingExclusions =
  "-" +
  [
    "*.Tests",
    "FluentMigrator",
    "FluentMigrator.Runner",
    "PeanutButter.*",
    "GenericBuilderTestArtifactBuilders",
    "GenericBuilderTestArtifactEntities"
  ].join(";-");
env.register({
  name: "COVERAGE_REPORTING_EXCLUDE",
  default: defaultCoverageReportingExclusions,
  help:
    "Mask to apply for coverage exclusions (see ReportGenerator documentation for '-assemblyfilters')"
});

env.register({
  name: "BUILD_TOOLS_FOLDER",
  help: "Location for downloading locally-used build tools (eg nuget, nunit, opencover, report generator)",
  default: "build-tools"
});

env.register({
  name: "DOTNET_PUBLISH_RUNTIMES",
  help: "Runtimes to publish dotnet core targets for, if required",
});

env.register({
  name: "PUBLISH_BUILD_CONFIGURATION",
  help: "Build configuration to use when publishing dotnet core projects",
  default: "Release"
});

debug("-- env registration complete --");
