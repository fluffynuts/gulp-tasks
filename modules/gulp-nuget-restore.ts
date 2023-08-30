import { BufferFile } from "vinyl";
import { Stream } from "stream";

(function() {
    const
        path = require("path"),
        gutil = requireModule<GulpUtil>("gulp-util"),
        es = require("event-stream"),
        system = requireModule<System>("system"),
        log = requireModule<Log>("log"),
        resolveNuget = requireModule<ResolveNuget>("resolve-nuget"),
        env = requireModule<Env>("env"),
        isDotnetCore = env.resolveFlag("DOTNET_CORE"),
        nugetExe = isDotnetCore ? (process.platform === "win32" ? "dotnet.exe" : "dotnet") : "nuget.exe",
        debug = requireModule<DebugFactory>("debug")(__filename);

    const PLUGIN_NAME = "gulp-nuget-restore";
    let DEBUG = true;

    function nugetRestore(options: NugetRestoreOptions) {
        options = options || {};
        DEBUG = options.debug || process.env.DEBUG === "*" || false;
        options.force = options.force || false;
        if (DEBUG) {
            log.setThreshold(log.LogLevels.Debug);
        }
        const solutionFiles = [] as string[];
        const stream = es.through(function write(this: Stream, file: BufferFile) {
            if (!file) {
                fail(stream, "file may not be empty or undefined");
            }
            solutionFiles.push(file.path);
            this.emit("data", file);
        }, function end(this: Stream) {
            restoreNugetPackagesWith(this, solutionFiles, options);
        });
        return stream;
    }

    function fail(stream: Stream, msg: string) {
        stream.emit("error", new gutil.PluginError(PLUGIN_NAME, msg));
    }

    function end(stream: Stream) {
        stream.emit("end");
    }

    function determineRestoreCommandFor(
        nugetPath: string,
        stream: Stream
    ) {
        try {
            const nuget = resolveNuget(nugetPath);
            debug("Resolved restore tool at: " + nuget);
            return nuget;
        } catch (e) {
            const ex = e as Error;
            fail(stream, [
                `No restore tool (nuget / dotnet) resolved: ${ ex }`,
                `stack: ${ ex.stack || "no stack" }`
            ].join("\n"));
        }
    }

    function runNuget(
        restoreCommand: string,
        solutions: string[],
        stream: Stream
    ) {
        debug(`restoreCmd: ${ restoreCommand }`);
        const deferred = Promise.resolve();
        const final = solutions.reduce((promise, item) => {
            log.info("Restoring packages for: " + item);
            const pathParts = item.split(/[\\|\/]/g);
            const sln = pathParts[pathParts.length - 1];
            const slnFolder = pathParts.slice(0, pathParts.length - 1).join(path.sep);
            const args = [ "restore", sln ];
            if (env.resolveFlag("ENABLE_NUGET_PARALLEL_PROCESSING")) {
                log.warn(
                    "Processing restore in parallel. If you get strange build errors, unset ENABLE_NUGET_PARALLEL_PROCESSING");
            } else {
                if (isDotnetCore) {
                    args.push("--disable-parallel");
                } else {
                    args.push("-DisableParallelProcessing");
                }
            }
            return promise.then(() => system(
                restoreCommand,
                args, {
                    cwd: slnFolder
                }
            ).then(function() {
                log.info(`Packages restored for: ${ item }`);
            }).catch(function(err) {
                throw err;
            }));
        }, deferred);
        final.then(function() {
            end(stream);
        }).catch(function(err) {
            fail(stream, err);
        });
    }

    function restoreNugetPackagesWith(
        stream: Stream,
        solutions: string[],
        options: NugetRestoreOptions
    ) {
        if (solutions.length === 0) {
            return fail(stream, "No solutions defined for nuget restore");
        }
        const nuget = options.nuget || nugetExe;
        const nugetCmd = determineRestoreCommandFor(nuget, stream);
        if (nugetCmd) {
            runNuget(nugetCmd, solutions, stream);
        } else {
            fail(stream, "Can't determine nuget command");
        }
    }

    module.exports = nugetRestore;
})();
