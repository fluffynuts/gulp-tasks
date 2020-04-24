"use strict";
var gutil = requireModule("gulp-util"),
  env = requireModule("env"),
  es = require("event-stream"),
  path = require("path"),
  fs = require("fs"),
  testUtilFinder = require("./testutil-finder"),
  getToolsFolder = require("./get-tools-folder"),
  spawn = require("./spawn"),
  mkdirp = require("mkdirp"),
  os = require("os"),
  coverageTarget = process.env.COVERAGE_TARGET || "Debug",
  debug = require("debug")("gulp-dotnetcover"),
  log = require("./log");

var PLUGIN_NAME = "gulp-dotnetcover";

function projectPathFor(p) {
  return path.resolve(p);
}

function dotCover(options) {
  options = options || {};
  options.exec = options.exec || {};
  options.exec.dotCover =
    options.exec.dotCover || testUtilFinder.latestDotCover(options);
  options.exec.openCover =
    options.exec.openCover || testUtilFinder.latestOpenCover(options);
  options.exec.nunit =
    options.exec.nunit || testUtilFinder.latestNUnit(options);
  options.baseFilters =
    options.baseFilters || "+:module=*;class=*;function=*;-:*.Tests";
  options.exclude = options.exclude || [];
  options.nunitOptions = options.nunitOptions || "--labels=Before";
  if (Array.isArray(options.nunitOptions)) {
    options.nunitOptions = options.nunitOptions.join(" ");
  }
  options.nunitOutput = projectPathFor(
    options.nunitOutput || "buildreports/nunit-result.xml"
  );
  options.coverageReportBase = projectPathFor(
    options.coverageReportBase || "buildreports/coverage"
  );
  options.coverageOutput = projectPathFor(
    options.coverageOutput || "buildreports/coveragesnapshot"
  );
  options.agents = options.agents || process.env.MAX_NUNIT_AGENTS; // allow setting max agents via environment variable
  mkdirp(options.coverageReportBase); // because open-cover is too lazy to do it itself :/
  if (typeof options.testAssemblyFilter !== "function") {
    var regex = options.testAssemblyFilter;
    options.testAssemblyFilter = function(file) {
      return !!file.match(regex);
    };
  }

  var assemblies = [];

  var stream = es.through(
    function write(file) {
      if (!file) {
        fail(this, "file may not be empty or undefined");
      }
      var filePath = file.history[0];
      var parts = filePath.split("\\");
      if (parts.length === 1) {
        parts = filePath.split("/");
      }
      // only accept the one which is in the debug project output for itself
      var filePart = parts[parts.length - 1];
      var projectParts = filePart.split(".");
      var projectName = projectParts
        .slice(0, projectParts.length - 1)
        .join(".");
      var isBin = parts.indexOf("bin") > -1;
      var isRelevantForCoverageTarget =
        parts.indexOf(coverageTarget) > -1 ||
        parts.indexOf("bin") === parts.length - 2;
      var isProjectMatch =
        options.allowProjectAssemblyMismatch || parts.indexOf(projectName) > -1;
      var include = isBin && isRelevantForCoverageTarget && isProjectMatch;
      if (include) {
        debug("include: " + filePath);
        assemblies.push(file);
      } else {
        debug("ignore: " + filePath);
        debug("isBin: " + isBin);
        debug("isDebugOrAgnostic: " + isRelevantForCoverageTarget);
        debug("isProjectMatch: " + isProjectMatch);
      }
      this.emit("data", file);
    },
    function end() {
      runCoverageWith(this, assemblies, options);
    }
  );
  return stream;
}

function findLocalExactExecutable(options, what) {
  var toolsFolder = path.join(process.cwd(), getToolsFolder()).toLowerCase();
  return what.reduce((acc, cur) => {
    if (acc || !options.exec[cur]) {
      return acc;
    }
    var exe = trim(options.exec[cur], "\\s", '"', "'");
    if (exe.toLowerCase().indexOf(toolsFolder) === 0) {
      log.info(`preferring local tool: ${exe}`);
      return exe;
    }
    return acc;
  }, undefined);
}
function findExactExecutable(stream, options, what, deferLocal) {
  if (!Array.isArray(what)) {
    what = [what];
  }
  if (!deferLocal) {
    var local = findLocalExactExecutable(options, what);
    if (local) {
      return local;
    }
  }
  var resolved = what.reduce((acc, cur) => {
    cur = findKeyInsensitive(options.exec, cur);
    if (!options.exec[cur]) {
      return acc;
    }
    var exe = trim(options.exec[cur], "\\s", '"', "'");
    if (!fs.existsSync(exe)) {
      fail(
        stream,
        `Can"t find executable for "${cur}" at provided path: "${
          options.exec[cur]
        }"`
      );
    }
    return exe;
  }, undefined);
  return (
    resolved ||
    fail(
      stream,
      `Auto-detection of system-wide executables (${what.join(
        ","
      )}) not implemented and local version not found. Please specify the exec.{tool} option(s) as required.`
    )
  );
}

function findKeyInsensitive(obj, seekKey) {
  return obj
    ? Object.keys(obj).filter(
        k => k.toLowerCase() === seekKey.toLowerCase()
      )[0] || seekKey
    : seekKey;
}

function findCoverageTool(stream, options) {
  return options.coverageTool
    ? findExactExecutable(stream, options, [options.coverageTool], true)
    : findExactExecutable(stream, options, ["dotCover", "openCover"]);
}

function findNunit(stream, options) {
  return findExactExecutable(stream, options, "nunit");
}

function fail(stream, msg) {
  stream.emit("error", new gutil.PluginError(PLUGIN_NAME, msg));
}

function end(stream) {
  stream.emit("end");
}

function trim() {
  var args = Array.prototype.slice.call(arguments);
  var source = args[0];
  var replacements = args.slice(1).join(",");
  var regex = new RegExp(
    "^[" + replacements + "]+|[" + replacements + "]+$",
    "g"
  );
  return source.replace(regex, "");
}

function isNunit3(nunitRunner) {
  return nunitRunner.indexOf("nunit3-") > -1;
}

function generateXmlOutputSwitchFor(nunitRunner, options) {
  if ((options.nunitOptions || "").indexOf("/result:") > -1) {
    debug(
      `"/result" option already specified in nunitOptions("${
        options.nunitOptions
      }"), skipping generation`
    );
    return "";
  }
  var outFile = options.nunitOutput;
  return isNunit3(nunitRunner)
    ? `/result:${outFile};format=nunit2`
    : `/xml=${outFile}`;
}

function generateNoShadowFor(nunitRunner) {
  return isNunit3(nunitRunner) ? "" : "/noshadow"; // default to not shadow in nunit3 & /noshadow deprecated
}

function generatePlatformSwitchFor(nunitRunner, options) {
  var isX86 =
    options.x86 || (options.platform || options.architecture) === "x86";
  return isNunit3(nunitRunner) && isX86 ? "/x86" : ""; // nunit 2 has separate runners; 3 has a switch
}

function updateLabelsOptionFor(nunitOptions) {
  if (nunitOptions.indexOf("labels:") > -1) {
    return nunitOptions; // caller already updated for new labels= syntax
  }
  return nunitOptions.replace(/\/labels/, "/labels:Before");
}

function quoted(str) {
  return /[ "]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function generateAgentsLimitFor(nunit, options) {
  var limit = env.resolveNumber("MAX_NUNIT_AGENTS");
  return `--agents=${limit}`;
}

function runCoverageWith(stream, allAssemblies, options) {
  var scopeAssemblies = [];
  var testAssemblies = allAssemblies
    .map(function(file) {
      const replace = [
        process.cwd() + "\\",
        process.cwd().replace(/\\\\/g, "/") + "/"
      ];
      return replace.reduce((acc, cur) => acc.replace(cur, ""), file.path);
    })
    .filter(function(file) {
      return options.testAssemblyFilter(file) || !scopeAssemblies.push(file);
    })
    .map(function(file) {
      return file.replace(/\\/g, "/");
    });
  if (testAssemblies.length === 0) {
    return fail(
      stream,
      [
        "No test assemblies defined",
        "Hint: coverage will only be run on assemblies which are built as Debug (and reside in that folder)"
      ].join("\n")
    );
  }
  options.testAssemblies = testAssemblies; // so other things can use this
  var coverageToolExe = findCoverageTool(stream, options);
  debug(`selected coverage tool exe: ${coverageToolExe}`);
  var nunit = findNunit(stream, options);
  debug("testAssemblies:", testAssemblies);
  var q = quoteIfSpaced;
  var nunitOptions = [
    q(generateXmlOutputSwitchFor(nunit, options)),
    q(generateNoShadowFor(nunit)),
    q(generatePlatformSwitchFor(nunit, options)),
    q(generateAgentsLimitFor(nunit, options)),
    testAssemblies.map(quoted).join(" ")
  ].concat(q(updateLabelsOptionFor(options.nunitOptions).split(" ")));
  debug("nunit options: ", nunitOptions);
  var agents = parseInt(options.agents);
  if (!isNaN(agents)) {
    nunitOptions.push("--agents=" + agents);
  }
  nunitOptions = nunitOptions.join(" ");

  var coverageToolName = grokCoverageToolNameFrom(options, coverageToolExe);
  debug(`Running tool: ${coverageToolName}`);
  var cliOptions = getCliOptionsFor(
    stream,
    coverageToolName,
    options,
    nunit,
    nunitOptions
  );
  spawnCoverageTool(
    stream,
    coverageToolName,
    coverageToolExe,
    cliOptions,
    options
  );
}

var commandLineOptionsGenerators = {
  dotcover: getDotCoverOptionsFor,
  opencover: getOpenCoverOptionsFor
};

var coverageSpawners = {
  dotcover: spawnDotCover,
  opencover: spawnOpenCover
};

function spawnDotCover(stream, coverageToolExe, cliOptions, globalOptions) {
  const reportArgsFor = function(reportType) {
      log.info("creating XML args");
      return [
        "report",
        `/ReportType=${reportType}`,
        `/Source=${quoted(globalOptions.coverageOutput)}`,
        `/Output=${quoted(
          globalOptions.coverageReportBase + "." + reportType.toLowerCase()
        )}`
      ];
    },
    xmlArgs = reportArgsFor("XML"),
    htmlArgs = reportArgsFor("HTML");

  return spawn(coverageToolExe, cliOptions)
    .then(() => {
      log.info("creating XML report");
      return spawn(coverageToolExe, xmlArgs);
    })
    .then(() => {
      log.info("creating HTML report");
      return spawn(coverageToolExe, htmlArgs);
    })
    .then(() => {
      onCoverageComplete(stream);
    })
    .catch(err => handleCoverageFailure(stream, err, globalOptions));
}

function stringify(err) {
  if (err === undefined || err === null) {
    return `(${err})`;
  }
  if (typeof err === "string") {
    return err;
  }
  if (typeof err !== "object") {
    return err.toString();
  }
  try {
    return JSON.stringify(err);
  } catch (e) {
    return dumpTopLevel(err);
  }
}

function dumpTopLevel(obj) {
  const result = [];
  for (var prop in obj) {
    result.push(`${prop}: ${obj}`);
  }
  return `{\n\t${result.join("\n\t")}}`;
}

function logError(err) {
  log.error(gutil.colors.red(stringify(err)));
}

function handleCoverageFailure(stream, err) {
  logError(" --- COVERAGE FAILS ---");
  logError(err);
  fail(stream, "coverage fails");
}

function onCoverageComplete(stream) {
  log.info("ending coverage successfully");
  end(stream);
}

function spawnOpenCover(stream, exe, cliOptions, globalOptions) {
  debug(`Running opencover:`);
  debug(`${exe} ${cliOptions.join(" ")}`);
  return spawn(exe, cliOptions)
    .then(() => onCoverageComplete(stream))
    .catch(err => handleCoverageFailure(stream, err, globalOptions));
}

function generateOpenCoverFilter(prefix, namespaces) {
  return namespaces
    .reduce((acc, cur) => {
      if (cur.indexOf("[") > -1) {
        // this already has a module specification
        acc.push(`${prefix}${cur}`);
      } else {
        acc.push(`${prefix}[*]${cur}`);
      }
      return acc;
    }, [])
    .join(" ");
}
function shouldFailOnError(options) {
  return (options || {}).failOnError === undefined
    ? true
    : !!options.failOnError;
}
function quoteIfSpaced(str, quote) {
  if (str.indexOf(" ") == -1) {
    return str;
  }
  quote = quote || "\"";
  return `${quote}${str}${quote}`;
}

function getOpenCoverOptionsFor(options, nunit, nunitOptions) {
  const exclude =
      options.exclude && options.exclude.length ? options.exclude : ["*.Tests"],
    failOnError = shouldFailOnError(options),
    excludeFilter = generateOpenCoverFilter("-", exclude),
    dq = "\"\"";

  const result = [
    `"-target:${nunit}"`,
    `"-targetargs:${nunitOptions}"`,
    `"-targetdir:${process.cwd()}"`, // TODO: test me please
    `"-output:${options.coverageReportBase + ".xml"}"`,
    `-filter:"+[*]* ${excludeFilter}"`, // TODO: embetterment
    `-register`,
    `-mergebyhash`,
    `"-searchdirs:${getUniqueDirsFrom(options.testAssemblies)}"`
  ];
  if (failOnError) {
    result.push("-returntargetcode:0");
  }
  return result;
}

function getUniqueDirsFrom(filePaths) {
  return filePaths
    .reduce((acc, cur) => {
      var dirName = path.dirname(cur);
      var required = !acc.filter(p => cur === p)[0];
      if (required) {
        acc.push(quoteIfSpaced(dirName, "\"\""));
      }
      return acc;
    }, [])
    .join(",");
}

function spawnCoverageTool(
  stream,
  toolName,
  toolExe,
  cliOptions,
  globalOptions
) {
  var spawner = coverageSpawners[toolName];
  debug({
    toolName,
    toolExe,
    cliOptions,
    globalOptions
  });
  return spawner
    ? spawner(stream, toolExe, cliOptions, globalOptions)
    : unsupportedTool(stream, toolName);
}

function unsupportedTool(stream, toolName) {
  fail(stream, `Coverage tool "${toolName}" not supported`);
}

function getCliOptionsFor(
  stream,
  coverageToolName,
  options,
  nunit,
  nunitOptions
) {
  var generator = commandLineOptionsGenerators[coverageToolName];
  return generator
    ? generator(options, nunit, nunitOptions)
    : unsupportedTool(stream, coverageToolName);
}

function getToolNameForExe(options, toolExe) {
  return (
    Object.keys(options.exec).filter(k => toolExe === options.exec[k])[0] || ""
  ).toLowerCase();
}
function grokCoverageToolNameFrom(options, toolExe) {
  return getToolNameForExe(options, toolExe) || options.coverageTool;
}

function getDotCoverOptionsFor(options, nunit, nunitOptions) {
  var filterJoin = ";-:",
    scopeAssemblies = options.testAssemblies;

  var filters = options.baseFilters;
  if (options.exclude.length) {
    filters = [filters, options.exclude.join(filterJoin)].join(filterJoin);
  }

  var dotCoverOptions = [
    "cover",
    `/TargetExecutable=${quoted(nunit)}`,
    `/AnalyseTargetArguments=False`,
    `/Output=${quoted(options.coverageOutput)}`,
    `/Filters=${quoted(filters)}`,
    `/ProcessFilters=-:sqlservr.exe`,
    `/TargetWorkingDir=${quoted(process.cwd())}`,
    `/TargetArguments=${quoted(nunitOptions)}`
  ];
  if (scopeAssemblies.length) {
    dotCoverOptions.push(`/Scope=${quoted(scopeAssemblies.join(";"))}`);
  }
  log.info("running testing with coverage...");
  log.info("running dotcover with: " + dotCoverOptions.join(" "));
  return dotCoverOptions;
}

module.exports = dotCover;
