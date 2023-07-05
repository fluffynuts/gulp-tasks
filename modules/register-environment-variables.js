"use strict";
(function () {
    // dev note: when updating here, don't forget to add to types.d.ts/global/Env
    const debug = require("debug")("env"), { ZarroError } = requireModule("zarro-error"), os = require("os"), path = require("path"), getToolsFolder = requireModule("get-tools-folder");
    module.exports = function _env(env) {
        const msbuildVerbosityOptions = "one of: q[uiet] / m[inimal] / n[ormal] / d[etailed] / diag[nostic]";
        debug("-- start env var registration --");
        env.register({
            name: "BUILD_TOOLS_FOLDER",
            help: "Location for downloading locally-used build tools (eg nuget, nunit, opencover, report generator)",
            default: "build-tools"
        });
        env.register({
            name: "USE_SYSTEM_NUGET",
            default: "false",
            help: "Whether or not to use nuget.exe if found in the path"
        });
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
            default: "false",
            help: "run your dotnet core tests in parallel - will be automatically enabled if not set and the quackers logger is used"
        });
        env.register({
            name: "BUILD_MAX_CPU_COUNT",
            default: os.cpus().length.toString(),
            help: "Max number of cpus to use whilst building",
            overriddenBy: "MAX_CONCURRENCY",
            when: overrideWhenSmaller
        });
        function overrideWhenSmaller(existing, override) {
            const existingNumber = parseInt(`${existing}`, 10);
            const overrideNumber = parseInt(`${override}`, 10);
            if (isNaN(existingNumber) || isNaN(overrideNumber)) {
                throw new ZarroError(`Can't determine if override '${override}' should take precedence over '${existing}'`);
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
            default: `${os.cpus().length - 1}`,
            help: "How many NUNit agents to use for testing (net framework)",
            overriddenBy: "MAX_CONCURRENCY",
            when: overrideWhenSmaller
        });
        env.register({
            name: "BUILD_INCLUDE",
            default: "*.sln",
            help: "Mask to use for selecting solutions to build"
        });
        env.register({
            name: "BUILD_EXCLUDE",
            default: `**/node_modules/**/*.sln,./${getToolsFolder(env)}/**/*.sln`,
            help: "mask to use for specifically omitting solutions from build"
        });
        env.register({
            name: "BUILD_ADDITIONAL_EXCLUDE",
            default: "",
            help: "mask of extra exclusions on top of the default set"
        });
        env.register({
            name: "DOTNET_CORE",
            default: "false",
            help: "set to a truthy value to guide build to use 'dotnet build'"
        });
        env.register({
            name: "NUNIT_ARCHITECTURE",
            help: "the architecture for tests run through nunit-runner",
            default: "(auto)"
        });
        env.register({
            name: "BUILD_REPORT_XML",
            default: "buildreports/nunit-result.xml",
            help: "file path for test results (nunit)"
        });
        env.register({
            name: "NUNIT_LABELS",
            default: "Before",
            help: "when to display a test label (before or after the test, or both, if available)"
        });
        env.register({
            name: "NUNIT_PROCESS",
            default: "auto",
            help: "process model for nunit-runner to use"
        });
        const extra = `
   - globs match dotnet core projects or .net framework built assemblies
   - elements surrounded with () are treated as pure gulp.src masks`, defaultTestInclude = "*.Tests,*.Tests.*,Tests,Test,Test.*", defaultTestExclude = `{!**/node_modules/**/*},{!./${getToolsFolder(env)}/**/*}`;
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
            help: `Verbosity of reporting for dotnet core testing: ${msbuildVerbosityOptions}`,
            default: "normal"
        });
        env.register({
            name: "PACK_VERBOSITY",
            help: `Verbosity of reporting when packing: ${msbuildVerbosityOptions}`
        });
        env.register({
            name: "BUILD_TOOLSVERSION",
            help: "Tools Version to pass to msbuild for building with",
            default: "auto"
        });
        env.register({
            name: "BUILD_TARGETS",
            help: "Targets to invoke msbuild with",
            default: "Build"
        });
        env.register({
            name: "BUILD_VERBOSITY",
            help: `Verbosity of reporting for msbuild building: ${msbuildVerbosityOptions}`,
            default: "minimal"
        });
        const defaultCoverageExclusions = "Dapper,MySql.Data,MySqlConnector,FluentMigrator.*,PeanutButter.*,AutoMapper,AutoMapper.*,*.Tests.*,nunit.framework,NExpect";
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
        const defaultReportsPath = path.join("buildreports", "coverage.xml");
        env.register({
            name: "COVERAGE_XML",
            default: defaultReportsPath,
            help: "Path to coverage XML output"
        });
        const defaultCoverageReportingExclusions = "-" +
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
            help: "Mask to apply for coverage exclusions (see ReportGenerator documentation for '-assemblyfilters')"
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
            overriddenBy: ["GIT_OVERRIDE_BRANCH"]
        });
        env.register({
            name: "GIT_MAIN_BRANCH",
            help: "The main branch (typically master) against which verification is done",
            default: "master"
        });
        env.register({
            name: "GIT_DEFAULT_UPSTREAM",
            help: "The default upstream (typically origin) against which verification is done",
            default: "origin"
        });
        env.register({
            name: "GIT_VERIFY_BRANCH",
            help: "The fully-qualified branch name to use when verifying (defaults to checked out branch)"
        });
        env.register({
            name: "ENFORCE_VERIFICATION",
            help: "(boolean) when set to a truthy value, 'verify-up-to-date' will error if the current branch is behind the main one",
            default: "true"
        });
        env.register({
            name: "INTERACTIVE",
            help: "(boolean) flag to enable interactive processing, where available",
            default: "false"
        });
        env.register({
            name: "SKIP_FETCH_ON_VERIFY",
            help: "(boolean) skip the fetch on verification: useful from CI where you should already have recently fetched",
            default: "false"
        });
        env.register({
            name: "GIT_FETCH_TIMEOUT",
            help: "(number) the max time, in milliseconds, to wait for git fetch",
            default: "30000"
        });
        env.register({
            name: "GIT_VERIFY_TIMEOUT",
            help: "(number) the max time, in milliseconds, to wait for verification sub-processes",
            default: "5000"
        });
        env.register({
            name: "GIT_FETCH_RECENT_TIME",
            help: "(number) when testing the last gi fetch time, consider the fetch fresh enough if it happend within this many seconds in the past",
            default: "60" // default is to skip fetch if last fetch < 1 minute ago
        });
        env.register({
            name: "GIT_OVERRIDE_REMOTE",
            help: "set this to override the GIT_REMOTE set by CI when, eg, you'd like to push to a different remote"
        });
        env.register({
            name: "GIT_REMOTE",
            help: "the checked-out remote according to git (should be set by CI, and CI may check out a sha but report a remote, so this is useful)",
            default: "",
            overriddenBy: ["GIT_OVERRIDE_REMOTE"]
        });
        env.register({
            name: "NUGET_API_KEY",
            help: "api key to use when attempting to publish to nuget (required for dotnet core, can be used for regular nuget.exe too)",
            default: ""
        });
        env.register({
            name: "NUGET_PUSH_TIMEOUT",
            help: "timeout, in seconds, for an attempted push of a nuget package; if left undefined, the default for the tool is used (typically 300, ie 5 min)",
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
            name: "DOTNET_PUBLISH_OS",
            help: "The target operating system for the publish command (default is the current OS)"
        });
        env.register({
            name: "DOTNET_PUBLISH_ARCH",
            help: "The architecture to use for publish commands"
        });
        env.register({
            name: "DOTNET_PUBLISH_FRAMEWORK",
            help: "The .net framework to use for publish commands"
        });
        env.register({
            name: "DOTNET_PUBLISH_SELF_CONTAINED",
            help: "Flag: whether or not to publish self-contained. If a runtime is specified and this is not, it's assume on as that's the default for 'dotnet publish'",
            default: "true"
        });
        env.register({
            name: "DOTNET_PUBLISH_MANIFEST",
            help: "Path to a target manifest file that contains a list of packages to be excluded from the publish step"
        });
        env.register({
            name: "DOTNET_PUBLISH_NO_BUILD",
            help: "Skip build on publish",
            default: "false"
        });
        env.register({
            name: "DOTNET_PUBLISH_VERSION_SUFFIX",
            help: "Set the version suffix for the published artifact(s)"
        });
        env.register({
            name: "DOTNET_PUBLISH_NO_RESTORE",
            help: "Skip package restore on publish",
            default: "false"
        });
        env.register({
            name: "DOTNET_PUBLISH_USE_CURRENT_RUNTIME",
            help: "Use the current runtime for published artifacts",
            default: "true"
        });
        env.register({
            name: "DOTNET_PUBLISH_VERBOSITY",
            help: `Verbosity to use during publish operation: ${msbuildVerbosityOptions}`
        });
        env.register({
            name: "MSBUILD_PROPERTIES",
            help: "MSBuild properties: either a comma-delimited list like 'VAR1=VAL1,VAR2=VAL2' or json, or a path to a file containing json"
        });
        env.register({
            name: "DOTNET_DISABLE_BUILD_SERVERS",
            help: "Force dotnet to ignore any persistent build servers",
            default: "false"
        });
        env.register({
            name: "NO_UNICODE",
            help: "Prevent unicode output for status lines",
            default: "false"
        });
        env.register({
            name: "NO_COLOR",
            help: "Prevent color output for status lines",
            default: "false"
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
        if (!!process.env.PACKAGE_TARGET_FOLDER) {
            throw new ZarroError(`env var PACKAGE_TARGET_FOLDER has been renamed to PACK_TARGET_FOLDER`);
        }
        env.register({
            name: "PACK_TARGET_FOLDER",
            help: "Folder to serve as output for package build tasks",
            default: "packages"
        });
        env.register({
            name: "NUGET_IGNORE_DUPLICATE_PACKAGES",
            help: "Ignore errors produced by attempting to push duplicate packages",
            default: "true"
        });
        env.register({
            name: "PACK_INCLUDE_CSPROJ",
            help: "Mask to apply for inclusions to 'dotnet pack'",
            default: ""
        });
        env.register({
            name: "PACK_EXCLUDE_CSPROJ",
            help: "Mask to apply for exclusions to 'dotnet pack'",
            default: ""
        });
        env.register({
            name: "PACK_INCLUDE_NUSPEC",
            help: "Mask to apply for inclusions to 'pack' target for nuspec files (nuget.exe packing)",
            default: "**/*.nuspec"
        });
        env.register({
            name: "PACK_EXCLUDE_NUSPEC",
            help: "Mask to apply for exclusions to 'pack' target for nuspec files (nuget.exe packing)",
            default: ""
        });
        env.register({
            name: "PACK_SUPPLEMENTARY_NUSPEC",
            help: "Relative path to use when packing with dotnet: look for this .nuspec relative to the current .csproj to supply to dotnet pack. If it is found, it will be used.",
            default: "Package.nuspec"
        });
        env.register({
            name: "PACK_IGNORE_MISSING_DEFAULT_NUSPEC",
            help: "When PACK_SUPPLEMENTARY_NUSPEC has not been explicitly set, ignore default missing .nuspec files (ie, use Package.nuspec if available, otherwise don't)",
            default: "true"
        });
        env.register({
            name: "PACK_CONFIGURATION",
            help: "Build configuration for dotnet-core packing",
            default: "Release",
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
            name: "PACK_BASE_PATH",
            help: "Base path to pack nuget packages from"
        });
        env.register({
            name: "PACK_INCLUDE_EMPTY_DIRECTORIES",
            help: "Flag: include empty directories in the output nupkg",
            default: "false"
        });
        env.register({
            name: "PACK_VERSION",
            help: "Override versioning in nuspec"
        });
        env.register({
            name: "PACK_INCLUDE_SYMBOLS",
            help: "Include symbols in the output (default is .snupkg)",
            default: "true"
        });
        env.register({
            name: "PACK_INCLUDE_SOURCE",
            help: "Include source in the output packages",
            default: "false"
        });
        env.register({
            name: "PACK_LEGACY_SYMBOLS",
            help: "When including symbols, use legacy output",
            default: "false"
        });
        env.register({
            name: "PACK_NO_BUILD",
            help: "Skip build when packing",
            default: "false"
        });
        env.register({
            name: "PACK_NO_RESTORE",
            help: "Skip package restore when packing",
            default: "false"
        });
        env.register({
            name: "PACKAGE_JSON",
            help: "Path to package.json to be used for subsequent processing",
            default: "package.json"
        });
        env.register({
            name: "UPDATE_SUBMODULES_TO_LATEST",
            help: "Flag: whether or not update-git-modules should update submodules to the latest version on their master branch",
            default: "true"
        });
        env.register({
            name: "VERSION_INCREMENT_STRATEGY",
            help: [
                "Selects which part of a version is incremented when attempting to increment version numbers",
                "- select from major, minor, patch, prerelease"
            ].join("\n"),
            default: "patch"
        });
        env.register({
            name: "INITIAL_RELEASE",
            help: "skip version incrementing for this initial release",
            default: "false"
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
                "Enable beta flag for operation (eg beta or pre-release package)"
            ],
            default: "false"
        });
        env.register({
            name: "NPM_PUBLISH_ACCESS",
            help: "Access level to use for package publish",
            default: "public"
        });
        function retryMessage(label) {
            return `Retry ${label} again up to this many times on failure (work around transient errors on build host)`;
        }
        env.register({
            name: "MAX_RETRIES",
            help: retryMessage("all retryable operations"),
            default: "0"
        });
        env.register({
            name: "BUILD_RETRIES",
            help: retryMessage("the build"),
            default: "0",
            overriddenBy: "MAX_RETRIES"
        });
        env.register({
            name: "RESTORE_RETRIES",
            help: retryMessage("nuget package restore"),
            default: "0",
            overriddenBy: "MAX_RETRIES"
        });
        env.register({
            name: "RETAIN_TEST_DIAGNOSTICS",
            help: "when set truthy, testing logs and internal traces won't be deleted after testing",
            default: "true"
        });
        env.register({
            name: "DOTNET_TEST_QUIET_QUACKERS",
            help: "when set truthy and using the Quackers logger, suppress non-quackers logging",
            default: "true"
        });
        env.register({
            name: "DOTNET_TEST_PREFIXES",
            default: "",
            help: "prefix test names by project with a mapping like 'PROJECT:PREFIX;PROJECT:PREFIX'"
        });
        env.register({
            name: "ZARRO_ALLOW_FILE_CONFIG_RESOLUTION",
            default: "true",
            help: `when enabled, the value provided by an environment variable may be the path
 to a file to use for that configuration; for example MSBUILD_PROPERTIES=foo.json will
 instruct Zarro to read the mapping in foo.json for extra msbuild properties to pass on
 where applicable.`
        });
        env.register({
            name: "DEV_SMTP_PORT",
            help: `the port to start the smtp dev server on`,
            default: "25"
        });
        env.register({
            name: "DEV_SMTP_INTERFACE_PORT",
            help: "the port to start the http interface on for the dev smtp server",
            default: "8025"
        });
        env.register({
            name: "DEV_SMTP_DETACHED",
            help: "start the dev smtp server in the background (ie, don't wait on it); you'll have to stop it yourself",
            default: "false"
        });
        env.register({
            name: "DEV_SMTP_IGNORE_ERRORS",
            help: "when set true, don't break on being unable to download or run the dev smtp server software - just log it and move on",
            default: "false"
        });
        env.register({
            name: "DEV_SMTP_BIND_IP",
            help: "IP to listen on for SMTP connections; default is to bind to all available interfaces",
            default: ""
        });
        env.register({
            name: "DEV_SMTP_INTERFACE_BIND_IP",
            help: "IP to listen on for the interface; default is to bind to all available interfaces",
            default: ""
        });
        env.register({
            name: "DEV_SMTP_OPEN_INTERFACE",
            help: "flag: when set true, zarro will open the dev smtp server interface after starting it",
            default: "true"
        });
        debug("-- env registration complete --");
    };
})();
