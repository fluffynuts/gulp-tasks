import { Stream } from "stream";
import { BufferFile } from "vinyl";

(function() {
    const
        gutil = requireModule<GulpUtil>("gulp-util"),
        env = requireModule<Env>("env"),
        es = require("event-stream"),
        path = require("path"),
        testUtilFinder = requireModule<TestUtilFinder>("testutil-finder"),
        getToolsFolder = requireModule<GetToolsFolder>("get-tools-folder"),
        system = requireModule<System>("system"),
        coverageTarget = process.env.COVERAGE_TARGET || "Debug",
        debug = requireModule<DebugFactory>("debug")(__filename),
        log = requireModule<Log>("log"),
        { mkdir, fileExistsSync } = require("yafs");

    const PLUGIN_NAME = "gulp-dotnetcover";

    function projectPathFor(p: string): string {
        return path.resolve(p);
    }

    function dotCover(opts?: GulpDotNetCoverOptions) {
        const options = opts || {} as GulpDotNetCoverOptions;
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
        options.nunitOutput = projectPathFor(
            options.nunitOutput || "buildreports/nunit-result.xml"
        );
        options.coverageReportBase = projectPathFor(
            options.coverageReportBase || "buildreports/coverage"
        );
        options.coverageOutput = projectPathFor(
            options.coverageOutput || "buildreports/coveragesnapshot"
        );
        options.agents = options.agents || env.resolveNumber("MAX_NUNIT_AGENTS"); // allow setting max agents via environment variable
        mkdir(options.coverageReportBase); // because open-cover is too lazy to do it itself :/
        if (typeof options.testAssemblyFilter !== "function") {
            const regex = options.testAssemblyFilter;
            options.testAssemblyFilter = function(file) {
                return !!file.match(regex);
            };
        }

        const assemblies = [] as string[];

        const stream = es.through(
            function write(this: Stream, file: BufferFile) {
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
                const isRelevantForCoverageTarget =
                    parts.indexOf(coverageTarget) > -1 ||
                    parts.indexOf("bin") === parts.length - 2;
                const isProjectMatch =
                    options.allowProjectAssemblyMismatch || parts.indexOf(projectName) > -1;
                const include = isBin && isRelevantForCoverageTarget && isProjectMatch;
                if (include) {
                    debug("include: " + filePath);
                    assemblies.push(file.path);
                } else {
                    debug("ignore: " + filePath);
                    debug("isBin: " + isBin);
                    debug("isDebugOrAgnostic: " + isRelevantForCoverageTarget);
                    debug("isProjectMatch: " + isProjectMatch);
                }
                stream.emit("data", file);
            },
            function end(this: Stream) {
                runCoverageWith(this, assemblies, options);
            }
        );
        return stream;
    }

    function findLocalExactExecutable(
        options: GulpDotNetCoverOptions,
        what: string[]
    ): Optional<string> {
        if (!options) {
            throw new Error(``);
        }
        const exec = options.exec;
        if (!exec) {
            throw new Error(``);
        }
        const toolsFolder = path.join(process.cwd(), getToolsFolder()).toLowerCase();
        return what.reduce((acc: string, cur: string) => {
            const key = cur as keyof GulpDotNetCoverExec;
            if (acc || !exec[key]) {
                return acc;
            }
            const exe = trim(exec[key], "\\s", "\"", "'");
            if (exe.toLowerCase().indexOf(toolsFolder) === 0) {
                log.info(`preferring local tool: ${ exe }`);
                return exe;
            }
            return acc;
        }, "");
    }

    function findExactExecutable(
        stream: Stream,
        options: GulpDotNetCoverOptions,
        what: string | string[],
        deferLocal?: boolean
    ) {
        if (!Array.isArray(what)) {
            what = [ what ];
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
        const resolved = what.reduce((acc: Optional<string>, cur: string) => {
            const key = findKeyInsensitive<GulpDotNetCoverExec>(exec, cur) as keyof GulpDotNetCoverExec;
            if (!exec[key]) {
                return acc;
            }
            const exe = trim(exec[key], "\\s", "\"", "'");
            if (!fileExistsSync(exe)) {
                fail(
                    stream,
                    `Can"t find executable for "${ cur }" at provided path: "${
                        exec[key]
                    }"`
                );
            }
            return exe;
        }, undefined);
        return (
            resolved ||
            fail(
                stream,
                `Auto-detection of system-wide executables (${ what.join(
                    ","
                ) }) not implemented and local version not found. Please specify the exec.{tool} option(s) as required.`
            )
        );
    }

    function isDefined<T>(o: Optional<T>): o is T {
        return o !== undefined;
    }

    function findKeyInsensitive<T>(obj: T, seekKey: string): keyof T {
        return (obj
                ? Object.keys(obj).filter(
                k => k.toLowerCase() === seekKey.toLowerCase()
            )[0] || seekKey
                : seekKey
        ) as keyof T;
    }

    function findCoverageTool(stream: Stream, options: GulpDotNetCoverOptions) {
        return options.coverageTool
            ? findExactExecutable(stream, options, [ options.coverageTool ], true)
            : findExactExecutable(stream, options, [ "openCover", "dotCover" ]);
    }

    function findNunit(stream: Stream, options: GulpDotNetCoverOptions) {
        return findExactExecutable(stream, options, "nunit");
    }

    function fail(stream: Stream, msg: string) {
        stream.emit("error", new gutil.PluginError(PLUGIN_NAME, msg));
    }

    function end(stream: Stream) {
        stream.emit("end");
    }

    function trim(...args: Optional<string>[]) {
        const source = args[0] || "";
        const replacements = args.slice(1).join(",");
        const regex = new RegExp(
            "^[" + replacements + "]+|[" + replacements + "]+$",
            "g"
        );
        return source.replace(regex, "");
    }

    function isNunit3(nunitRunner: string) {
        return nunitRunner.indexOf("nunit3-") > -1;
    }

    function generateXmlOutputSwitchFor(
        nunitRunner: string,
        options: GulpDotNetCoverOptions
    ) {
        if ((options.nunitOptions || "").indexOf("/result:") > -1) {
            debug(
                `"/result" option already specified in nunitOptions("${
                    options.nunitOptions
                }"), skipping generation`
            );
            return "";
        }
        const outFile = options.nunitOutput;
        return isNunit3(nunitRunner)
            ? `/result:${ outFile };format=nunit2`
            : `/xml=${ outFile }`;
    }

    function generateNoShadowFor(nunitRunner: string) {
        return isNunit3(nunitRunner) ? "" : "/noshadow"; // default to not shadow in nunit3 & /noshadow deprecated
    }

    function generatePlatformSwitchFor(nunitRunner: string, options: GulpDotNetCoverOptions) {
        const isX86 =
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
        return /[ "]/.test(str) ? `"${ str.replace(/"/g, "\"\"") }"` : str;
    }

    function generateAgentsLimitFor(nunit, options) {
        const limit = options.agents;
        return `--agents=${ limit }`;
    }

    function isFilter(o: any): o is ((s: string) => boolean) {
        return typeof o === "function";
    }

    function runCoverageWith(
        stream: Stream,
        allAssemblies: string[],
        options: GulpDotNetCoverOptions
    ) {
        const scopeAssemblies = [];
        const testAssemblies = allAssemblies
            .map(function(file) {
                const replace = [
                    process.cwd() + "\\",
                    process.cwd().replace(/\\\\/g, "/") + "/"
                ];
                return replace.reduce((acc, cur) => acc.replace(cur, ""), file);
            })
            .filter(function(file) {
                if (!isFilter(options.testAssemblyFilter)) {
                    throw new Error(`test assembly filter should be a function`);
                }
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
        const coverageToolExe = findCoverageTool(stream, options);
        debug(`selected coverage tool exe: ${ coverageToolExe }`);
        const nunit = findNunit(stream, options);
        debug("testAssemblies:", testAssemblies);
        const q = quoteIfSpaced;
        let nunitOptions = [
            q(generateXmlOutputSwitchFor(nunit, options)),
            q(generateNoShadowFor(nunit)),
            q(generatePlatformSwitchFor(nunit, options)),
            q(generateAgentsLimitFor(nunit, options)),
            testAssemblies.map(quoted).join(" ")
        ].concat(q(updateLabelsOptionFor(options.nunitOptions).split(" ")));
        debug("nunit options: ", nunitOptions);
        const agents = parseInt(options.agents);
        if (!isNaN(agents)) {
            nunitOptions.push("--agents=" + agents);
        }
        nunitOptions = nunitOptions.join(" ");

        const coverageToolName = grokCoverageToolNameFrom(options, coverageToolExe);
        debug(`Running tool: ${ coverageToolName }`);
        const cliOptions = getCliOptionsFor(
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

    const commandLineOptionsGenerators = {
        dotcover: getDotCoverOptionsFor,
        opencover: getOpenCoverOptionsFor
    };

    const coverageSpawners = {
        dotcover: spawnDotCover,
        opencover: spawnOpenCover
    };

    function spawnDotCover(stream, coverageToolExe, cliOptions, globalOptions) {
        const reportArgsFor = function(reportType) {
                log.info("creating XML args");
                return [
                    "report",
                    `/ReportType=${ reportType }`,
                    `/Source=${ quoted(globalOptions.coverageOutput) }`,
                    `/Output=${ quoted(
                        globalOptions.coverageReportBase + "." + reportType.toLowerCase()
                    ) }`
                ];
            },
            xmlArgs = reportArgsFor("XML"),
            htmlArgs = reportArgsFor("HTML");

        return system(coverageToolExe, cliOptions)
            .then(() => {
                log.info("creating XML report");
                return system(coverageToolExe, xmlArgs);
            })
            .then(() => {
                log.info("creating HTML report");
                return system(coverageToolExe, htmlArgs);
            })
            .then(() => {
                onCoverageComplete(stream);
            })
            .catch(err => handleCoverageFailure(stream, err, globalOptions));
    }

    function stringify(err) {
        if (err === undefined || err === null) {
            return `(${ err })`;
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
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                result.push(`${ prop }: ${ obj[prop] }`);
            }
        }
        return `{\n\t${ result.join("\n\t") }}`;
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

    function findCaseInsensitiveUniqueEnvironmentVariables() {
        // naive: last wins
        return Object.keys(process.env).reduce(
            (acc, cur) => {
                const existing = Object.keys(acc).find(k => k.toLowerCase() === cur);
                if (existing) {
                    acc[existing] = process.env[cur];
                } else {
                    acc[cur] = process.env[cur];
                }
                return acc;
            }, {});
    }

    function spawnOpenCover(stream, exe, cliOptions, globalOptions) {
        debug(`Running opencover:`);
        debug(`${ exe } ${ cliOptions.join(" ") }`);
        const env = findCaseInsensitiveUniqueEnvironmentVariables();
        debug("setting open-cover env:", {
            env
        });
        return system(exe, cliOptions, { env })
            .then(() => onCoverageComplete(stream))
            .catch(err => handleCoverageFailure(stream, err, globalOptions));
    }

    function generateOpenCoverFilter(prefix, namespaces) {
        return namespaces
            .reduce((acc, cur) => {
                if (cur.indexOf("[") > -1) {
                    // this already has a module specification
                    acc.push(`${ prefix }${ cur }`);
                } else {
                    acc.push(`${ prefix }[*]${ cur }`);
                }
                return acc;
            }, [])
            .join(" ");
    }

    function shouldFailOnError(options: GulpDotNetCoverOptions) {
        return (options || {}).failOnError === undefined
            ? true
            : !!options.failOnError;
    }

    function quoteIfSpaced(str: string, quote?: string) {
        if (str.indexOf(" ") === -1) {
            return str;
        }
        quote = quote || "\"";
        return `${ quote }${ str }${ quote }`;
    }

    function getOpenCoverOptionsFor(
        options: GulpDotNetCoverOptions,
        nunit: string,
        nunitOptions
    ) {
        const exclude =
                options.exclude && options.exclude.length ? options.exclude : [ "*.Tests" ],
            failOnError = shouldFailOnError(options),
            excludeFilter = generateOpenCoverFilter("-", exclude);

        const result = [
            `"-target:${ nunit }"`,
            `"-targetargs:${ nunitOptions }"`,
            `"-targetdir:${ process.cwd() }"`, // TODO: test me please
            `"-output:${ options.coverageReportBase + ".xml" }"`,
            `-filter:"+[*]* ${ excludeFilter }"`, // TODO: embetterment
            `-register`,
            `-mergebyhash`,
            `"-searchdirs:${ getUniqueDirsFrom(options.testAssemblies) }"`
        ];
        if (failOnError) {
            result.push("-returntargetcode:0");
        }
        return result;
    }

    function getUniqueDirsFrom(filePaths: string[]) {
        return filePaths
            .reduce((acc, cur) => {
                const dirName = path.dirname(cur);
                const required = !acc.filter(p => cur === p)[0];
                if (required) {
                    acc.push(quoteIfSpaced(dirName, "\"\""));
                }
                return acc;
            }, [] as string[])
            .join(",");
    }

    function spawnCoverageTool(
        stream: Stream,
        toolName: string,
        toolExe: string,
        cliOptions: string[],
        globalOptions: any // FIXME
    ) {
        const spawner = coverageSpawners[toolName as keyof typeof coverageSpawners];
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

    function unsupportedTool(stream: Stream, toolName: string) {
        fail(stream, `Coverage tool "${ toolName }" not supported`);
    }

    function getCliOptionsFor(
        stream: Stream,
        coverageToolName: string,
        options: GulpDotNetCoverOptions,
        nunit: string,
        nunitOptions: GulpDotNetCoverNunitOptions
    ) {
        const generator = commandLineOptionsGenerators[
            coverageToolName as keyof typeof commandLineOptionsGenerators
            ];
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
        const filterJoin = ";-:",
            scopeAssemblies = options.testAssemblies;

        let filters = options.baseFilters;
        if (options.exclude.length) {
            filters = [ filters, options.exclude.join(filterJoin) ].join(filterJoin);
        }

        const dotCoverOptions = [
            "cover",
            `/TargetExecutable=${ quoted(nunit) }`,
            `/AnalyseTargetArguments=False`,
            `/Output=${ quoted(options.coverageOutput) }`,
            `/Filters=${ quoted(filters) }`,
            `/ProcessFilters=-:sqlservr.exe`,
            `/TargetWorkingDir=${ quoted(process.cwd()) }`,
            `/TargetArguments=${ quoted(nunitOptions) }`
        ];
        if (scopeAssemblies.length) {
            dotCoverOptions.push(`/Scope=${ quoted(scopeAssemblies.join(";")) }`);
        }
        log.info("running testing with coverage...");
        log.info("running dotcover with: " + dotCoverOptions.join(" "));
        return dotCoverOptions;
    }

    module.exports = dotCover;
})();
