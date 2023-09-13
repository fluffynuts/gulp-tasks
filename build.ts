import { Stream, Transform } from "stream";

(function () {
  const
    chalk = requireModule<AnsiColors>("ansi-colors"),
    os = require("os"),
    env = requireModule<Env>("env"),
    gulp = requireModule<Gulp>("gulp"),
    debug = requireModule<DebugFactory>("debug")(__filename),
    promisifyStream = requireModule<PromisifyStream>("promisify-stream"),
    throwIfNoFiles = requireModule<ThrowIfNoFiles>("throw-if-no-files"),
    xbuild = requireModule<GulpXBuild>("gulp-xbuild"),
    gutil = requireModule<GulpUtil>("gulp-util"),
    log = requireModule<Log>("log"),
    resolveMasks = requireModule<ResolveMasks>("resolve-masks"),
    logConfig = requireModule<LogConfig>("log-config"),
    tryDo = requireModule<TryDo<any>>("try-do"),
    msbuild = requireModule<GulpMsBuild>("gulp-msbuild");

  gulp.task("prebuild", gulp.series("nuget-restore", "clean"));

  const myTasks = [ "build" ],
    myVars = [
      env.BUILD_CONFIGURATION,
      env.BUILD_PLATFORM,
      env.BUILD_ARCHITECTURE,
      env.BUILD_TARGETS,
      env.BUILD_TOOLSVERSION,
      env.BUILD_VERBOSITY,
      env.BUILD_MSBUILD_NODE_REUSE,
      env.BUILD_MAX_CPU_COUNT,
      env.MAX_CONCURRENCY,
      env.BUILD_INCLUDE,
      env.BUILD_EXCLUDE,
      env.BUILD_ADDITIONAL_EXCLUDE,
      env.BUILD_SHOW_INFO,
      env.BUILD_FAIL_ON_ERROR,
      env.BUILD_RETRIES,
      env.BUILD_FRAMEWORK,
      env.BUILD_RUNTIME
    ];
  env.associate(myVars, myTasks);

  gulp.task(
    "build",
    "Builds Visual Studio solutions in tree",
    [ "prebuild" ],
    tryBuild
  );

  gulp.task("quick-build", "Quick build without pre-cursors", tryBuild);

  async function tryBuild() {
    return tryDo(
      build,
      "BUILD_RETRIES",
      e => console.error(chalk.red(`Build fails: ${ e }`)),
      () => console.log(chalk.magentaBright(
        `Build fails! If the error looks transient, I suggest setting the environment variable 'BUILD_RETRIES' to some number > 0 🔨.`))
    );
  }

  async function build() {
    const slnMasks = resolveMasks(
      env.BUILD_INCLUDE,
      [ env.BUILD_EXCLUDE, env.BUILD_ADDITIONAL_EXCLUDE ]
    );
    debug({
      slnMasks,
      cwd: process.cwd()
    });
    const solutions = gulp
      .src(slnMasks, { allowEmpty: true })
      .pipe(throwIfNoFiles(`No solutions found matching masks: ${ slnMasks }}`));

    // TODO: find a reliable, quick way to determine if the projects to be compiled
    //       are all dotnet core -- trawling *.csproj is slow and has caused hangups
    //       here, so for now, DNC build must be requested via env DONET_CORE
    const useDotNetCore = env.resolveFlag("DOTNET_CORE");
    if (useDotNetCore) {
      await buildForNetCore(solutions);
    } else {
      await buildForNETFramework(solutions);
    }
  }

  function buildForNetCore(solutions: Stream) {
    const { build } = requireModule<GulpDotNetCli>("gulp-dotnet-cli");
    log.info(gutil.colors.yellow("Building with dotnet core"));
    const
      configuration = env.resolve(env.BUILD_CONFIGURATION),
      msbuildArgs = [];
    if (!env.resolveFlag(env.BUILD_MSBUILD_NODE_REUSE)) {
      msbuildArgs.push("/nodeReuse:false");
    }
    /** @type DotNetBuildOptions */
    const options = {
      target: "[not set]",
      verbosity: env.resolve(env.BUILD_VERBOSITY),
      configuration: configuration,
      additionalArguments: msbuildArgs,
      framework: env.resolve(env.BUILD_FRAMEWORK),
      runtime: env.resolve(env.BUILD_RUNTIME)
    } satisfies DotNetBuildOptions;
    return promisifyStream(
      solutions
        .pipe(
          build(options)
        )
    );
  }

  function buildForNETFramework(solutions: Transform) {
    log.info(chalk.yellowBright("Building with MsBuild"));
    return promisifyStream(buildAsStream(solutions));
  }

  function buildAsStream(solutions: Transform) {
    const builder = os.platform() === "win32" ? msbuild : xbuild;
    const config = {
      toolsVersion: env.resolve(env.BUILD_TOOLSVERSION),
      targets: env.resolveArray(env.BUILD_TARGETS),
      configuration: env.resolve(env.BUILD_CONFIGURATION),
      stdout: true,
      verbosity: env.resolve(env.BUILD_VERBOSITY),
      errorOnFail: env.resolveFlag(env.BUILD_FAIL_ON_ERROR),
      solutionPlatform: env.resolve(env.BUILD_PLATFORM),
      // NB: this is the MSBUILD architecture, NOT your desired output architecture
      architecture: env.resolve(env.BUILD_ARCHITECTURE),
      nologo: false,
      logCommand: true,
      nodeReuse: env.resolveFlag(env.BUILD_MSBUILD_NODE_REUSE),
      maxcpucount: env.resolveNumber(env.BUILD_MAX_CPU_COUNT)
    };

    if (env.resolveFlag("BUILD_SHOW_INFO")) {
      const
        buildRetries = env.resolveNumber(env.BUILD_RETRIES),
        retryMessage = buildRetries > 0 ? `yes (${ buildRetries })` : `no`;

      logConfig({
        ...config,
        buildRetries: retryMessage
      }, {
        toolsVersion: "Tools version",
        targets: "Build targets",
        configuration: "Build configuration",
        stdout: "Log to stdout",
        verbosity: "Build verbosity",
        errorOnFail: "Any error fails the build",
        solutionPlatform: "Build platform",
        architecture: "Build architecture",
        nodeReuse: "Re-use MSBUILD nodes",
        maxcpucount: "Max CPUs to use for build",
        buildRetries: "Retry builds"
      });
    }
    return solutions
      .pipe(builder(config));
  }
})();
