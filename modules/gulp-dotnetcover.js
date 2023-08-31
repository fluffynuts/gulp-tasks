"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const gutil = requireModule("gulp-util"), env = requireModule("env"), es = require("event-stream"), path = require("path"), testUtilFinder = requireModule("testutil-finder"), getToolsFolder = requireModule("get-tools-folder"), system = requireModule("system"), coverageTarget = process.env.COVERAGE_TARGET || "Debug", debug = requireModule("debug")(__filename), log = requireModule("log"), { mkdirSync, fileExistsSync } = require("yafs");
    const PLUGIN_NAME = "gulp-dotnetcover";
    function projectPathFor(p) {
        return path.resolve(p);
    }
    const defaultCoverageOutput = "buildreports/coveragesnapshot";
    function dotCover(opts) {
        const options = opts || {};
        options.failOnError = options.failOnError || true;
        options.exec = options.exec || {};
        options.exec.dotCover =
            options.exec.dotCover || testUtilFinder.latestDotCover();
        options.exec.openCover =
            options.exec.openCover || testUtilFinder.latestOpenCover();
        options.exec.nunit =
            options.exec.nunit || testUtilFinder.latestNUnit();
        options.baseFilters =
            options.baseFilters || "+:module=*;class=*;function=*;-:*.Tests";
        options.exclude = options.exclude || [];
        options.nunitOptions = options.nunitOptions || "--labels=Before";
        options.allowProjectAssemblyMismatch = options.allowProjectAssemblyMismatch || false;
        if (Array.isArray(options.nunitOptions)) {
            options.nunitOptions = options.nunitOptions.join(" ");
        }
        options.nunitOutput = projectPathFor(options.nunitOutput || "buildreports/nunit-result.xml");
        options.coverageReportBase = projectPathFor(options.coverageReportBase || "buildreports/coverage");
        options.coverageOutput = projectPathFor(options.coverageOutput || defaultCoverageOutput);
        options.agents = options.agents || env.resolveNumber("MAX_NUNIT_AGENTS"); // allow setting max agents via environment variable
        mkdirSync(options.coverageReportBase); // because open-cover is too lazy to do it itself :/
        if (options.testAssemblyFilter && typeof options.testAssemblyFilter !== "function") {
            const regex = options.testAssemblyFilter;
            options.testAssemblyFilter = function (file) {
                return !!file.match(regex);
            };
        }
        const assemblies = [];
        const stream = es.through(function write(file) {
            if (!file) {
                fail(this, "file may not be empty or undefined");
            }
            const filePath = file.history[0];
            let parts = filePath.split("\\");
            if (parts.length === 1) {
                parts = filePath.split("/");
            }
            // only accept the one which is in the debug project output for itself
            const filePart = parts[parts.length - 1];
            const projectParts = filePart.split(".");
            const projectName = projectParts
                .slice(0, projectParts.length - 1)
                .join(".");
            const isBin = parts.indexOf("bin") > -1;
            const isRelevantForCoverageTarget = parts.indexOf(coverageTarget) > -1 ||
                parts.indexOf("bin") === parts.length - 2;
            const isProjectMatch = options.allowProjectAssemblyMismatch || parts.indexOf(projectName) > -1;
            const include = isBin && isRelevantForCoverageTarget && isProjectMatch;
            if (include) {
                debug("include: " + filePath);
                assemblies.push(file.path);
            }
            else {
                debug("ignore: " + filePath);
                debug("isBin: " + isBin);
                debug("isDebugOrAgnostic: " + isRelevantForCoverageTarget);
                debug("isProjectMatch: " + isProjectMatch);
            }
            stream.emit("data", file);
        }, function end() {
            runCoverageWith(this, assemblies, options);
        });
        return stream;
    }
    function findLocalExactExecutable(options, what) {
        if (!options) {
            throw new Error(``);
        }
        const exec = options.exec;
        if (!exec) {
            throw new Error(``);
        }
        const toolsFolder = path.join(process.cwd(), getToolsFolder()).toLowerCase();
        return what.reduce((acc, cur) => {
            const key = cur;
            if (acc || !exec[key]) {
                return acc;
            }
            const exe = trim(exec[key], "\\s", "\"", "'");
            if (exe.toLowerCase().indexOf(toolsFolder) === 0) {
                log.info(`preferring local tool: ${exe}`);
                return exe;
            }
            return acc;
        }, "");
    }
    function findExactExecutable(stream, options, what, deferLocal) {
        if (!Array.isArray(what)) {
            what = [what];
        }
        if (!deferLocal) {
            const local = findLocalExactExecutable(options, what);
            if (local) {
                return local;
            }
        }
        const exec = options.exec;
        if (!isDefined(exec)) {
            throw new Error(`options.exec not defined`);
        }
        const resolved = what.reduce((acc, cur) => {
            const key = findKeyInsensitive(exec, cur);
            if (!exec[key]) {
                return acc;
            }
            const exe = trim(exec[key], "\\s", "\"", "'");
            if (!fileExistsSync(exe)) {
                fail(stream, `Can"t find executable for "${cur}" at provided path: "${exec[key]}"`);
            }
            return exe;
        }, undefined);
        return (resolved ||
            fail(stream, `Auto-detection of system-wide executables (${what.join(",")}) not implemented and local version not found. Please specify the exec.{tool} option(s) as required.`));
    }
    function isDefined(o) {
        return o !== undefined;
    }
    function findKeyInsensitive(obj, seekKey) {
        return (obj
            ? Object.keys(obj).filter(k => k.toLowerCase() === seekKey.toLowerCase())[0] || seekKey
            : seekKey);
    }
    function findCoverageTool(stream, options) {
        return options.coverageTool
            ? findExactExecutable(stream, options, [options.coverageTool], true)
            : findExactExecutable(stream, options, ["openCover", "dotCover"]);
    }
    function findNunit(stream, options) {
        return findExactExecutable(stream, options, "nunit");
    }
    function fail(stream, msg) {
        stream.emit("error", new gutil.PluginError(PLUGIN_NAME, msg));
        return "";
    }
    function end(stream) {
        stream.emit("end");
    }
    function trim(...args) {
        const source = args[0] || "";
        const replacements = args.slice(1).join(",");
        const regex = new RegExp("^[" + replacements + "]+|[" + replacements + "]+$", "g");
        return source.replace(regex, "");
    }
    function isNunit3(nunitRunner) {
        return nunitRunner.indexOf("nunit3-") > -1;
    }
    function generateXmlOutputSwitchFor(nunitRunner, options) {
        if ((options.nunitOptions || "").indexOf("/result:") > -1) {
            debug(`"/result" option already specified in nunitOptions("${options.nunitOptions}"), skipping generation`);
            return "";
        }
        const outFile = options.nunitOutput;
        return isNunit3(nunitRunner)
            ? `/result:${outFile};format=nunit2`
            : `/xml=${outFile}`;
    }
    function generateNoShadowFor(nunitRunner) {
        return isNunit3(nunitRunner) ? "" : "/noshadow"; // default to not shadow in nunit3 & /noshadow deprecated
    }
    function generatePlatformSwitchFor(nunitRunner, options) {
        const isX86 = options.x86 ||
            (options.platform || options.architecture) === "x86";
        return isNunit3(nunitRunner) && isX86 ? "/x86" : ""; // nunit 2 has separate runners; 3 has a switch
    }
    function updateLabelsOptionFor(nunitOptions) {
        if (!nunitOptions) {
            return "";
        }
        if (nunitOptions.indexOf("labels:") > -1) {
            return nunitOptions; // caller already updated for new labels= syntax
        }
        return nunitOptions.replace(/\/labels/, "/labels:Before");
    }
    function quoted(str) {
        return /[ "]/.test(str)
            ? `"${str.replace(/"/g, "\"\"")}"`
            : str;
    }
    function generateAgentsLimitFor(options) {
        const limit = options.agents;
        return `--agents=${limit}`;
    }
    function isFilter(o) {
        return typeof o === "function";
    }
    function runCoverageWith(stream, allAssemblies, options) {
        const scopeAssemblies = [];
        const testAssemblies = allAssemblies
            .map(function (file) {
            const replace = [
                process.cwd() + "\\",
                process.cwd().replace(/\\\\/g, "/") + "/"
            ];
            return replace.reduce((acc, cur) => acc.replace(cur, ""), file);
        })
            .filter(function (file) {
            if (!isFilter(options.testAssemblyFilter)) {
                throw new Error(`test assembly filter should be a function`);
            }
            return options.testAssemblyFilter(file) || !scopeAssemblies.push(file);
        })
            .map(function (file) {
            return file.replace(/\\/g, "/");
        });
        if (testAssemblies.length === 0) {
            return fail(stream, [
                "No test assemblies defined",
                "Hint: coverage will only be run on assemblies which are built as Debug (and reside in that folder)"
            ].join("\n"));
        }
        options.testAssemblies = testAssemblies; // so other things can use this
        const coverageToolExe = findCoverageTool(stream, options);
        debug(`selected coverage tool exe: ${coverageToolExe}`);
        const nunit = findNunit(stream, options);
        debug("testAssemblies:", testAssemblies);
        const q = quoteIfSpaced;
        let nunitOptions = [
            q(generateXmlOutputSwitchFor(nunit, options)),
            q(generateNoShadowFor(nunit)),
            q(generatePlatformSwitchFor(nunit, options)),
            q(generateAgentsLimitFor(options)),
            testAssemblies.map(quoted).join(" ")
        ];
        if (options.nunitOptions) {
            const providedOptions = updateLabelsOptionFor(options.nunitOptions)
                .split(" ")
                .map(s => q(s));
            nunitOptions.push(...providedOptions);
        }
        debug("nunit options: ", nunitOptions);
        const agents = parseInt(`${options.agents}`, 10);
        if (!isNaN(agents)) {
            nunitOptions.push("--agents=" + agents);
        }
        const nunitOptionsLine = nunitOptions.join(" ");
        const coverageToolName = grokCoverageToolNameFrom(options, coverageToolExe);
        if (!coverageToolName) {
            throw new Error(`unable to determine the correct coverage tool to use`);
        }
        debug(`Running tool: ${coverageToolName}`);
        const cliOptions = getCliOptionsFor(stream, coverageToolName, options, nunit, nunitOptionsLine);
        spawnCoverageTool(stream, coverageToolName, coverageToolExe, cliOptions, options);
    }
    const commandLineOptionsGenerators = {
        dotcover: getDotCoverOptionsFor,
        opencover: getOpenCoverOptionsFor
    };
    const coverageSpawners = {
        dotcover: spawnDotCover,
        opencover: spawnOpenCover
    };
    async function spawnDotCover(stream, coverageToolExe, cliOptions, globalOptions) {
        const coverageOutput = globalOptions.coverageOutput || defaultCoverageOutput;
        const reportArgsFor = (reportType) => {
            log.info("creating XML args");
            return [
                "report",
                `/ReportType=${reportType}`,
                `/Source=${quoted(coverageOutput)}`,
                `/Output=${quoted(globalOptions.coverageReportBase + "." + reportType.toLowerCase())}`
            ];
        }, xmlArgs = reportArgsFor("XML"), htmlArgs = reportArgsFor("HTML");
        try {
            await system(coverageToolExe, cliOptions);
            log.info("creating XML report");
            await system(coverageToolExe, xmlArgs);
            log.info("creating HTML report");
            await system(coverageToolExe, htmlArgs);
            onCoverageComplete(stream);
        }
        catch (err) {
            return handleCoverageFailure(stream, err, globalOptions);
        }
    }
    function stringify(err) {
        if (err === undefined || err === null) {
            return `(${err})`;
        }
        if (typeof err === "string") {
            return err;
        }
        if (typeof err !== "object") {
            return `${err}`;
        }
        try {
            return JSON.stringify(err);
        }
        catch (e) {
            return dumpTopLevel(err);
        }
    }
    function dumpTopLevel(obj) {
        const result = [];
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                result.push(`${prop}: ${obj[prop]}`);
            }
        }
        return `{\n\t${result.join("\n\t")}}`;
    }
    function logError(err) {
        log.error(gutil.colors.red(stringify(err)));
    }
    function handleCoverageFailure(stream, err, options) {
        logError(" --- COVERAGE FAILS ---");
        logError(err);
        logError(`"options:\n${JSON.stringify(options, null, 2)}`);
        fail(stream, "coverage fails");
    }
    function onCoverageComplete(stream) {
        log.info("ending coverage successfully");
        end(stream);
    }
    function findCaseInsensitiveUniqueEnvironmentVariables() {
        // naive: last wins
        return Object.keys(process.env).reduce((acc, cur) => {
            const envVar = process.env[cur];
            if (!envVar) {
                return acc;
            }
            const existing = Object.keys(acc)
                .find(k => k.toLowerCase() === cur);
            if (!!existing) {
                acc[existing] = envVar;
            }
            else {
                acc[cur] = envVar;
            }
            return acc;
        }, {});
    }
    async function spawnOpenCover(stream, exe, cliOptions, globalOptions) {
        debug(`Running opencover:`);
        debug(`${exe} ${cliOptions.join(" ")}`);
        const env = findCaseInsensitiveUniqueEnvironmentVariables();
        debug("setting open-cover env:", {
            env
        });
        try {
            await system(exe, cliOptions, { env });
            return onCoverageComplete(stream);
        }
        catch (err) {
            return handleCoverageFailure(stream, err, globalOptions);
        }
    }
    function generateOpenCoverFilter(prefix, namespaces) {
        return namespaces
            .reduce((acc, cur) => {
            if (cur.indexOf("[") > -1) {
                // this already has a module specification
                acc.push(`${prefix}${cur}`);
            }
            else {
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
        if (str.indexOf(" ") === -1) {
            return str;
        }
        quote = quote || "\"";
        return `${quote}${str}${quote}`;
    }
    function getOpenCoverOptionsFor(options, nunit, nunitOptions) {
        const exclude = options.exclude && options.exclude.length
            ? options.exclude
            : ["*.Tests"], failOnError = shouldFailOnError(options), excludeFilter = generateOpenCoverFilter("-", exclude), testAssemblies = options.testAssemblies;
        if (!testAssemblies) {
            throw new Error(`No test assemblies specified`);
        }
        const result = [
            `"-target:${nunit}"`,
            `"-targetargs:${nunitOptions}"`,
            `"-targetdir:${process.cwd()}"`,
            `"-output:${options.coverageReportBase + ".xml"}"`,
            `-filter:"+[*]* ${excludeFilter}"`,
            `-register`,
            `-mergebyhash`,
            `"-searchdirs:${getUniqueDirsFrom(testAssemblies)}"`
        ];
        if (failOnError) {
            result.push("-returntargetcode:0");
        }
        return result;
    }
    function getUniqueDirsFrom(filePaths) {
        return filePaths
            .reduce((acc, cur) => {
            const dirName = path.dirname(cur);
            const required = !acc.filter(p => cur === p)[0];
            if (required) {
                acc.push(quoteIfSpaced(dirName, "\"\""));
            }
            return acc;
        }, [])
            .join(",");
    }
    function spawnCoverageTool(stream, toolName, toolExe, cliOptions, globalOptions // FIXME
    ) {
        const spawner = coverageSpawners[toolName];
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
        return [];
    }
    function getCliOptionsFor(stream, coverageToolName, options, nunit, nunitOptions) {
        const generator = commandLineOptionsGenerators[coverageToolName];
        return generator
            ? generator(options, nunit, nunitOptions)
            : unsupportedTool(stream, coverageToolName);
    }
    function getToolNameForExe(options, toolExe) {
        if (!options) {
            return "";
        }
        const exec = options.exec;
        if (!exec) {
            return "";
        }
        return (Object.keys(exec)
            .filter(k => toolExe === exec[k])[0] || "").toLowerCase();
    }
    function grokCoverageToolNameFrom(options, toolExe) {
        return getToolNameForExe(options, toolExe)
            || options.coverageTool;
    }
    function getDotCoverOptionsFor(options, nunit, nunitOptions) {
        const filterJoin = ";-:", scopeAssemblies = options.testAssemblies || [];
        let filters = options.baseFilters;
        const exclude = options.exclude || [];
        if (exclude.length) {
            filters = [filters, exclude.join(filterJoin)].join(filterJoin);
        }
        const coverageOutput = options.coverageOutput || defaultCoverageOutput;
        const dotCoverOptions = [
            "cover",
            `/TargetExecutable=${quoted(nunit)}`,
            `/AnalyseTargetArguments=False`,
            `/Output=${quoted(coverageOutput)}`
        ];
        if (filters) {
            dotCoverOptions.push(`/Filters=${quoted(filters)}`);
        }
        dotCoverOptions.push(`/ProcessFilters=-:sqlservr.exe`, `/TargetWorkingDir=${quoted(process.cwd())}`, `/TargetArguments=${quoted(nunitOptions)}`);
        if (scopeAssemblies.length) {
            dotCoverOptions.push(`/Scope=${quoted(scopeAssemblies.join(";"))}`);
        }
        log.info("running testing with coverage...");
        log.info("running dotcover with: " + dotCoverOptions.join(" "));
        return dotCoverOptions;
    }
    module.exports = dotCover;
})();
