"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const temp = require("temp"), { mkdir } = require("yafs"), Vinyl = require("vinyl"), fs = require("./fs"), path = require("path"), parseXml = requireModule("parse-xml"), isPromise = requireModule("is-promise"), gutil = requireModule("gulp-util"), spawnNuget = requireModule("spawn-nuget"), debug = requireModule("debug")(__filename), env = requireModule("env"), es = require("event-stream");
    env.associate([
        "PACK_BASE_PATH",
        "PACK_VERSION",
        "PACK_INCLUDE_EMPTY_DIRECTORIES",
        "PACK_INCLUDE_SYMBOLS",
        "PACK_LEGACY_SYMBOLS"
    ], "pack");
    async function grokNuspec(xmlString) {
        const pkg = await parseXml(xmlString), metadata = pkg.package.metadata[0];
        return {
            packageName: metadata.id[0],
            packageVersion: metadata.version[0]
        };
    }
    async function resolveAll(obj) {
        const result = {};
        for (const key of Object.keys(obj)) {
            if (isPromise(obj[key])) {
                result[key] = await obj[key];
            }
            else {
                result[key] = obj[key];
            }
        }
        return result;
    }
    function resolveRelativeBasePathOn(options, nuspecPath) {
        if (!options.basePath) {
            return;
        }
        if (options.basePath.indexOf("~") === 0) {
            const packageDir = path.dirname(nuspecPath).replace(/\\/g, "/"), sliced = options.basePath.substring(1).replace(/\\/g, "/");
            options.basePath = path.join(packageDir, sliced);
        }
    }
    function addOptionalParameters(options, args) {
        if (options.basePath) {
            gutil.log(`packaging with base path: ${options.basePath}`);
            args.splice(args.length, 0, "-BasePath", options.basePath);
        }
        if (options.excludeEmptyDirectories) {
            args.splice(args.length, 0, "-ExcludeEmptyDirectories");
        }
        if (options.version) {
            gutil.log(`Overriding package version with: ${options.version}`);
            args.splice(args.length, 0, "-version", options.version);
        }
        if (options.symbols) {
            args.splice(args.length, 0, "-Symbols");
            if (!options.legacySymbols) {
                args.splice(args.length, 0, "-SymbolPackageFormat", "snupkg");
            }
        }
    }
    function gulpNugetPack(options) {
        options = Object.assign({}, options);
        options.basePath = env.resolve("PACK_BASE_PATH") || options.basePath;
        if (options.excludeEmptyDirectories === undefined) {
            options.excludeEmptyDirectories = env.resolveFlag("PACK_INCLUDE_EMPTY_DIRECTORIES");
        }
        if (options.version === undefined) {
            options.version = env.resolve("PACK_VERSION");
        }
        if (options.symbols === undefined) {
            options.symbols = env.resolveFlag("PACK_INCLUDE_SYMBOLS");
        }
        if (options.legacySymbols === undefined) {
            options.legacySymbols = env.resolveFlag("PACK_LEGACY_SYMBOLS");
        }
        const tracked = temp.track(), workDir = tracked.mkdirSync();
        let promise = Promise.resolve();
        return es.through(function write(file) {
            promise = promise.then(async () => {
                options = await resolveAll(options);
                resolveRelativeBasePathOn(options, file.path);
                const { packageName, packageVersion } = await grokNuspec(file.contents.toString()), version = options.version || packageVersion, expectedFileName = path.join(workDir, `${packageName}.${version}.nupkg`), args = ["pack", file.path, "-OutputDirectory", workDir];
                await mkdir(workDir);
                addOptionalParameters(options, args);
                await spawnNuget(args, {
                    stdout: () => {
                        /* suppress stdout: it's confusing anyway because it mentions temp files */
                    }
                });
                const outputExists = await fs.exists(expectedFileName);
                if (!outputExists) {
                    const err = `file not found: ${expectedFileName}`;
                    this.emit("error", err);
                    throw err;
                }
                else {
                    logBuilt(expectedFileName);
                    this.emit("data", new Vinyl({
                        path: path.basename(expectedFileName),
                        contents: await fs.readFile(expectedFileName)
                    }));
                }
            });
        }, async function end() {
            let errored = false;
            await promise.catch(err => {
                errored = true;
                this.emit("error", err);
            });
            if (!errored) {
                tracked.cleanup()
                    .catch(() => { });
                this.emit("end");
            }
        });
    }
    function logBuilt(packagePath) {
        debug(`built intermediate package: ${packagePath}`);
        gutil.log(gutil.colors.yellow(`built package: ${path.basename(packagePath)}`));
    }
    module.exports = {
        pack: gulpNugetPack
    };
})();
