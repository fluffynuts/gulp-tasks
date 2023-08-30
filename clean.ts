(function() {
    const
        gulp = requireModule<Gulp>("gulp"),
        promisifyStream = requireModule<PromisifyStream>("promisify-stream"),
        tryDo = requireModule<TryDo<any>>("try-do"),
        debug = requireModule<DebugFactory>("debug")(__filename),
        throwIfNoFiles = requireModule<ThrowIfNoFiles>("throw-if-no-files"),
        msbuild = requireModule<GulpMsBuild>("gulp-msbuild"),
        dotnetClean = requireModule<GulpDotNetCli>("gulp-dotnet-cli").clean,
        resolveMasks = requireModule<ResolveMasks>("resolve-masks"),
        env = requireModule<Env>("env"),
        chalk = requireModule<AnsiColors>("ansi-colors");

    const myVars = [
        "BUILD_TOOLSVERSION",
        "BUILD_CONFIGURATION",
        "BUILD_VERBOSITY",
        "BUILD_MAX_CPU_COUNT",
        "BUILD_FAIL_ON_ERROR",
        "BUILD_PLATFORM",
        "BUILD_ARCHITECTURE",
        "BUILD_MSBUILD_NODE_REUSE",
        "BUILD_RETRIES",
        "BUILD_TARGETS"
    ];
    env.associate(myVars, "clean");

    gulp.task(
        "clean",
        "Invokes the 'Clean' target on all solutions in the tree",
        tryClean
    );

    function tryClean() {
        return tryDo(
            clean,
            "BUILD_RETRIES",
            e => console.error(chalk.red(`Clean fails: ${ e }`))
        );
    }

    function clean() {
        const useDotNetCore = env.resolveFlag("DOTNET_CORE");
        if (useDotNetCore) {
            return cleanWithDotnet();
        } else {
            return cleanWithMsBuild();
        }
    }

    async function cleanWithDotnet() {
        const
            configuration = env.resolveArray("BUILD_CONFIGURATION"),
            slnMasks = resolveBuildSolutionMasks(),
            targets = env.resolveArray("BUILD_TARGETS", "BUILD_INCLUDE");
        debug({
                  slnMasks,
                  targets,
                  cwd: process.cwd()
              });
        const solutions = gulp
            .src(slnMasks, { allowEmpty: true })
            .pipe(throwIfNoFiles(`No solutions found matching masks: ${ slnMasks }}`));
        await promisifyStream(
            solutions.pipe(
                dotnetClean({
                                target: "(not set)",
                                configuration,
                                msbuildProperties: env.resolveMap("MSBUILD_PROPERTIES")
                            })
            )
        );
    }

    function resolveBuildSolutionMasks() {
        return resolveMasks("BUILD_INCLUDE", [ "BUILD_EXCLUDE", "BUILD_ADDITIONAL_EXCLUDE" ]);
    }

    function cleanWithMsBuild() {
        const
            slnMasks = resolveBuildSolutionMasks();
        return promisifyStream(
            gulp.src(slnMasks)
                .pipe(
                    msbuild({
                                toolsVersion: env.resolve("BUILD_TOOLSVERSION"),
                                targets: [ "Clean" ],
                                configuration: env.resolve("BUILD_CONFIGURATION"),
                                stdout: true,
                                logCommand: true,
                                errorOnFail: env.resolveFlag("BUILD_FAIL_ON_ERROR"),
                                solutionPlatform: env.resolve("BUILD_PLATFORM"),
                                architecture: env.resolve("BUILD_ARCHITECTURE"),
                                verbosity: env.resolve("BUILD_VERBOSITY"),
                                nodeReuse: env.resolveFlag("BUILD_MSBUILD_NODE_REUSE"),
                                maxcpucount: env.resolveNumber("BUILD_MAX_CPU_COUNT")
                            })
                )
        );
    }
})();
