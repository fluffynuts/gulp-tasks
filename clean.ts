(function () {
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
    env.BUILD_TOOLSVERSION,
    env.BUILD_CONFIGURATION,
    env.BUILD_VERBOSITY,
    env.BUILD_MAX_CPU_COUNT,
    env.BUILD_FAIL_ON_ERROR,
    env.BUILD_PLATFORM,
    env.BUILD_ARCHITECTURE,
    env.BUILD_MSBUILD_NODE_REUSE,
    env.BUILD_RETRIES,
    env.BUILD_TARGETS,
    env.BUILD_FRAMEWORK,
    env.BUILD_RUNTIME
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
          msbuildProperties: env.resolveMap(env.MSBUILD_PROPERTIES),
          verbosity: env.resolve(env.BUILD_VERBOSITY),
          framework: env.resolve(env.BUILD_FRAMEWORK),
          runtime: env.resolve(env.BUILD_RUNTIME)
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
