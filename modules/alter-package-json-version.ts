(function () {

    interface CompleteOptions extends AlterPackageJsonVersionOptions {
        packageJsonPath: string;
        dryRun: boolean;
        strategy: string;
        zero: boolean;
        incrementBy: number;
        tag?: string;
    }

    const
        guessIndent = requireModule<GuessIndent>("guess-indent"),
        ZarroError = requireModule<ZarroError>("zarro-error"),
        validVersionStrategies = new Set([ "major", "minor", "patch" ]),
        gutil = requireModule<GulpUtil>("gulp-util"),
        // env = requireModule<Env>("env"),
        {
            resolve,
            resolveNumber,
            resolveFlag,
            INITIAL_RELEASE,
            PACKAGE_JSON,
            DRY_RUN,
            VERSION_INCREMENT_STRATEGY,
            VERSION_INCREMENT_ZERO,
            PACK_INCREMENT_VERSION_BY
        } = requireModule<Env>("env"),
        { stat } = require("fs").promises,
        { readTextFile, writeTextFile } = require("yafs"),
        incrementVersion = requireModule<IncrementVersion>("increment-version");

    function validateVersioningStrategy(configuredStrategy: string) {
        if (validVersionStrategies.has(configuredStrategy)) {
            return;
        }
        throw new ZarroError(`version incrementing for package.json is restricted to one of 'major', 'minor' or 'patch'`);
    }

    async function alterPackageJsonVersion(
        inputOpts?: AlterPackageJsonVersionOptions
    ) {
        if (resolveFlag(INITIAL_RELEASE)) {
            return;
        }
        return new Promise<void>(async (resolve, reject) => {
            const
                opts = fillInFromEnvironment(inputOpts),
                st = await stat(opts.packageJsonPath);
            if (!st) {
                return reject(`Can't find file at '${ opts.packageJsonPath }'`);
            }
            validateVersioningStrategy(opts.strategy);
            try {
                const
                    json = await readTextFile(opts.packageJsonPath),
                    indent = guessIndent(json),
                    index = JSON.parse(json),
                    currentVersion = index.version || "0.0.0",
                    incremented = incrementVersion(
                        currentVersion,
                        opts.strategy,
                        opts.zero,
                        opts.incrementBy
                    );
                index.version = incremented;
                const newJson = JSON.stringify(index, null, indent);
                if (opts.dryRun) {
                    gutil.log(
                        gutil.colors.green(
                            `dry run: would increment version in '${ opts.packageJsonPath }' from '${ currentVersion }' to '${ incremented }'`
                        )
                    );
                }
                await writeTextFile(opts.packageJsonPath, newJson);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    function shouldFillInFromEnvironment(opts?: AlterPackageJsonVersionOptions) {
        if (!opts) {
            return true;
        }
        if (opts.loadUnsetFromEnvironment) {
            return true;
        }
        return (Object.keys(opts).length === 0);
    }

    function fillInFromEnvironment(opts?: AlterPackageJsonVersionOptions): CompleteOptions {
        if (!shouldFillInFromEnvironment(opts)) {
            return opts as CompleteOptions;
        }
        const result = { ...opts } as CompleteOptions;
        if (result.packageJsonPath === undefined) {
            result.packageJsonPath = resolve(PACKAGE_JSON);
        }
        if (result.dryRun === undefined) {
            result.dryRun = resolveFlag(DRY_RUN)
        }
        if (result.strategy === undefined) {
            result.strategy = resolve(VERSION_INCREMENT_STRATEGY);
        }
        if (result.zero === undefined) {
            result.zero = resolveFlag(VERSION_INCREMENT_ZERO);
        }
        if (result.incrementBy === undefined) {
            result.incrementBy = resolveNumber(PACK_INCREMENT_VERSION_BY);
        }
        return result as CompleteOptions;
    }

    module.exports = alterPackageJsonVersion;
})();
