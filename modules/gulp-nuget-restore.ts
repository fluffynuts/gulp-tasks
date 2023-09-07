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
        os = require("os"),
        nugetExe = isDotnetCore
            ? (os.platform() === "win32" ? "dotnet.exe" : "dotnet")
            : "nuget.exe",
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
            debug(`will restore packages for: ${file.path}`);
            solutionFiles.push(file.path);
            this.emit("data", file);
        }, async function end(this: Stream) {
            await restoreNugetPackagesWith(this, solutionFiles, options);
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

    async function runNuget(
        restoreCommand: string,
        solutions: string[],
        stream: Stream
    ): Promise<void> {
        debug(`restoreCmd: ${ restoreCommand }`);
        let currentItem = "";
        try {
            for (const item of solutions) {
                currentItem = item;
                log.info(`Restoring packages for: ${ item }`);
                const args = [ "restore", item ];
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
                await system(
                    restoreCommand,
                    args
                );
                log.info(`Packages restored for: ${ item }`);
            }
            end(stream);
        } catch (e) {
            fail(stream, `Unable to restore packages for ${currentItem}: ${e}`);
        }
    }

    async function restoreNugetPackagesWith(
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
            await runNuget(nugetCmd, solutions, stream);
        } else {
            fail(stream, "Can't determine nuget command");
        }
    }

    module.exports = nugetRestore;
})();
