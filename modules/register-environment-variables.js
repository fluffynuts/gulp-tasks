// when adding items to this file, it's a good idea to add them
// in alphabetical ordering so that it's easier to scan debug logs
// for vars you're looking for (:
// dev note: when updating here, don't forget to add to types.d.ts/global/Env

const debug = require("debug")("env"),
  os = require("os"),
  path = require("path"),
  getToolsFolder = requireModule("get-tools-folder");

module.exports = function _env(env) {
  debug("-- start env var registration --");

  env.register({
    name: "USE_SYSTEM_NUGET",
    default: "false",
    help: "Whether or not to use nuget.exe if found in the path"
  }, _env);

  env.register({
    name: "ENABLE_NUGET_PARALLEL_PROCESSING",
    default: "false",
    help: "Whether to enable parallel processing for nuget restore. Disabled by default as large restores can fail without proper errors"
  });

  env.register({
    name: "BUILD_SHOW_INFO",
    default: "true",
    help: "Whether or not to show information about the build before it starts"
  });

  env.register({
    name: "BUILD_FAIL_ON_ERROR",
    default: "true",
    help: "Whether to fail the build immediately on any build error"
  });

  env.register({
    name: "BUILD_MSBUILD_NODE_REUSE",
    default: "false",
    help: [
      "Whether or not to allow modern msbuild to reuse msbuild.exe nodes",
      "WARNING: enabling node reuse may cause esoteric build errors on shared environments"
    ].join("\n")
  });

  env.register({
    name: "MAX_CONCURRENCY",
    default: os.cpus().length.toString(),
    help: "Overrides other concurrency settings (BUILD_MAX_CPU_COUNT, MAX_NUNIT_AGENTS)"
  });

  env.register({
    name: "DOTNET_TEST_PARALLEL",
    default: false,
    help: "(experimental) run your dotnet core tests in parallel"
  });

  env.register({
    name: "BUILD_MAX_CPU_COUNT",
    default: os.cpus().length.toString(),
    help: "Max number of cpus to use whilst building",
    overriddenBy: "MAX_CONCURRENCY",
    when: overrideIsSmaller
  });

  function overrideIsSmaller(existing, override) {
    const existingNumber = parseInt(existing, 10);
    const overrideNumber = parseInt(override, 10);
    if (isNaN(existingNumber) || isNaN(overrideNumber)) {
      throw new Error(
        `Can't determine if override '${override}' should take precedence over '${existing}'`
      );
    }
    const result = overrideNumber < existingNumber;
    debug({
      existing,
      override,
      existingNumber,
      overrideNumber,
      result
    });
    return overrideNumber < existingNumber;
  }

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
    default: os.cpus().length - 1,
    help: "How many NUNit agents to use for testing (net framework)",
    overriddenBy: "MAX_CONCURRENCY",
    when: overrideIsSmaller
  });

  env.register({
    name: "BUILD_INCLUDE",
    default: "*.sln",
    help: "Mask to use for selecting solutions to build"
  });

  env.register({
    name: "BUILD_EXCLUDE",
    default: `**/node_modules/**/*.sln,./${getToolsFolder(env)}/**/*.sln`,
    help: "Mask to use for specifically omitting solutions from build"
  });

  env.register({
    name: "BUILD_ADDITIONAL_EXCLUDE",
    default: "",
    help: "Mask of extra exclusions on top of the default set"
  });

  env.register({
    name: "DOTNET_CORE",
    default: "false",
    help: "Set to a truthy value to guide build to use 'dotnet build'"
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
    default: "Before"
  });

  env.register({
    name: "NUNIT_PROCESS",
    default: "auto"
  });

  const extra = `
   - globs match dotnet core projects or .net framework built assemblies
   - elements surrounded with () are treated as pure gulp.src masks`,
    defaultTestInclude = "*.Tests,*.Tests.*,Tests,Test,Test.*",
    defaultTestExclude = `{!**/node_modules/**/*},{!./${getToolsFolder(env)}/**/*}`;
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
    "Dapper,MySql.Data,MySqlConnector,FluentMigrator.*,PeanutButter.*,AutoMapper,AutoMapper.*,*.Tests.*,nunit.framework,NExpect";
  env.register({
    name: "COVERAGE_EXCLUDE",
    help: "Exclusion masks to pass to coverage tool (overwrites defaults)",
    default: defaultCoverageExclusions
  });

  env.register({
    name: "COVERAGE_INCLUDE",
    help: "What to _include_ in coverage (defaults to everything but the excludes, also items mentioned here override excludes)",
    default: "*"
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
    default: ""
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
    help:
      "Location for downloading locally-used build tools (eg nuget, nunit, opencover, report generator)",
    default: "build-tools"
  });

  env.register({
    name: "DRY_RUN",
    help: "Flag that tasks may observe to only report what they are doing instead of actually doing it",
    default: "false"
  });

  env.register({
    name: "GIT_OVERRIDE_BRANCH",
    help: "set this to override the GIT_BRANCH set by CI when, eg, you'd like to push to a different branch"
  });

  env.register({
    name: "GIT_BRANCH",
    help: "the checked-out branch according to git (should be set by CI, and CI may check out a sha but report a branch, so this is useful)",
    default: "",
    overriddenBy: [ "GIT_OVERRIDE_BRANCH" ]
  });

  env.register({
    name: "GIT_MAIN_BRANCH",
    help: "The main branch (typically master) against which verification is done"
  });

  env.register({
    name: "GIT_VERIFY_BRANCH",
    help: "The fully-qualified branch name to use when verifying (defaults to checked out branch)"
  });

  env.register({
    name: "ENFORCE_VERIFICATION",
    help: "(boolean) when set to a truthy value, 'verify-up-to-date' will error if the current branch is behind the main one",
    default: true
  });

  env.register({
    name: "SKIP_FETCH_ON_VERIFY",
    help: "(boolean) skip the fetch on verification: useful from CI where you should already have recently fetched",
    default: false
  });

  env.register({
    name: "GIT_OVERRIDE_REMOTE",
    help: "set this to override the GIT_REMOTE set by CI when, eg, you'd like to push to a different remote"
  });

  env.register({
    name: "GIT_REMOTE",
    help: "the checked-out remote according to git (should be set by CI, and CI may check out a sha but report a remote, so this is useful)",
    default: "",
    overriddenBy: [ "GIT_OVERRIDE_REMOTE" ]
  });

  env.register({
    name: "NUGET_API_KEY",
    help: "api key to use when attempting to publish to nuget (required for dotnet core, can be used for regular nuget.exe too)",
    default: ""
  });

  env.register({
    name: "DOTNET_PUBLISH_RUNTIMES",
    help: "Runtimes to publish dotnet core targets for, if required"
  });

  env.register({
    name: "DOTNET_PUBLISH_BUILD_CONFIGURATION",
    help: "Build configuration to use when publishing dotnet core projects",
    default: "Release"
  });

  env.register({
    name: "OUTPUT",
    help: "Override output for whatever task you're running"
  });

  env.register({
    name: "PURGE_JS_DIRS",
    help: "Comma-separated list of directory names to search for when purging js",
    default: "node_modules,bower_components"
  });

  env.register({
    name: "PURGE_DOTNET_DIRS",
    help: "Comma-separated list of directory names to search for when purging dotnet",
    default: "obj,bin,packages"
  });

  env.register({
    name: "PURGE_ADDITIONAL_DIRS",
    help: "Comma-separated list of directory names to purge in addition to js & dotnet",
    default: ""
  });

  env.register({
    name: "PACKAGE_TARGET_FOLDER",
    help: "Folder to serve as output for package build tasks",
    default: "packages"
  });

  env.register({
    name: "PACK_INCLUDE",
    help: "Mask to apply for inclusions to 'dotnet pack'",
    default: ""
  });

  env.register({
    name: "PACK_EXCLUDE",
    help: "Mask to apply for exclusions to 'dotnet pack'",
    default: ""
  });

  env.register({
    name: "PACK_CONFIGURATION",
    help: "Build configuration for dotnet-core packing",
    default: "Release"
  });

  env.register({
    name: "PACK_INCREMENT_VERSION",
    help: "Flag: should package version be incremented before packing?",
    default: "true"
  });

  env.register({
    name: "PACK_INCREMENT_VERSION_BY",
    help: "Number (default 1): increment the selected version number by this value",
    default: "1"
  });

  env.register({
    name: "PACKAGE_JSON",
    help: "Path to package.json to be used for subsequent processing",
    default: "package.json"
  });

  env.register({
    name: "VERSION_INCREMENT_STRATEGY",
    help: [
      "Selects which part of a version is incremented when attempting to increment version numbers",
      "- select from major, minor, patch"
    ].join("\n"),
    default: "patch"
  });

  env.register({
    name: "VERSION_INCREMENT_ZERO",
    help: [
      "Flag: whether or not to reset lower-order version parts when incrementing higher-order ones",
      "eg: when incrementing the MAJOR version, should the MINOR and PATCH be set to zero?"
    ],
    default: "true"
  });

  env.register({
    name: "INCLUDE_PACKAGE_JSON",
    help: [
      "Mask for which package.json files to include"
    ],
    default: "**/package.json"
  });

  env.register({
    name: "EXCLUDE_PACKAGE_JSON",
    help: [
      "Mask for which package.json files to exclude"
    ],
    default: "**/node_modules/**"
  });

  env.register({
    name: "BETA",
    help: [
      "Enable beta flag for operation"
    ],
    default: "false"
  });

  debug("-- env registration complete --");
};
