(function() {
  const
    { publish } = requireModule<GulpDotNetCli>("gulp-dotnet-cli"),
    resolveMasks = requireModule<ResolveMasks>("resolve-masks"),
    env = requireModule<Env>("env"),
    gulp = requireModule<Gulp>("gulp");

  env.associate([
    env.DOTNET_PUBLISH_BUILD_CONFIGURATION,
    env.DOTNET_PUBLISH_RUNTIMES,
    env.OUTPUT,
    env.DOTNET_DISABLE_BUILD_SERVERS,
    env.DOTNET_PUBLISH_VERSION_SUFFIX,
    env.DOTNET_PUBLISH_SELF_CONTAINED,
    env.DOTNET_PUBLISH_MANIFEST,
    env.DOTNET_PUBLISH_USE_CURRENT_RUNTIME,
    env.DOTNET_PUBLISH_ARCH,
    env.DOTNET_PUBLISH_OS,
    env.DOTNET_PUBLISH_FRAMEWORK,
    env.DOTNET_PUBLISH_NO_BUILD,
    env.DOTNET_PUBLISH_NO_RESTORE,
    env.DOTNET_PUBLISH_VERBOSITY,
    env.DOTNET_PUBLISH_CONTAINER,
    env.DOTNET_PUBLISH_CONTAINER_IMAGE_NAME,
    env.DOTNET_PUBLISH_CONTAINER_IMAGE_TAG,
    env.DOTNET_PUBLISH_CONTAINER_REGISTRY,
    env.MSBUILD_PROPERTIES
  ], "dotnet-publish");

  gulp.task(
    "dotnet-publish",
    "Performs `dotnet publish` on all non-test projects in the tree",
    () => {
      /**
       * @type DotNetPublishOptions
       */
      const publishOpts = {
        configuration: env.resolve(env.DOTNET_PUBLISH_BUILD_CONFIGURATION, env.BUILD_CONFIGURATION),
        runtime: env.resolve(env.DOTNET_PUBLISH_RUNTIMES),
        output: env.resolve(env.OUTPUT),
        disableBuildServers: env.resolveFlag(env.DOTNET_DISABLE_BUILD_SERVERS),
        versionSuffix: env.resolve(env.DOTNET_PUBLISH_VERSION_SUFFIX),
        selfContained: env.resolveFlag(env.DOTNET_PUBLISH_SELF_CONTAINED),
        manifest: env.resolve(env.DOTNET_PUBLISH_MANIFEST),
        useCurrentRuntime: env.resolveFlag(env.DOTNET_PUBLISH_USE_CURRENT_RUNTIME),
        arch: env.resolve(env.DOTNET_PUBLISH_ARCH),
        os: env.resolve(env.DOTNET_PUBLISH_OS),
        framework: env.resolve(env.DOTNET_PUBLISH_FRAMEWORK),
        noBuild: env.resolveFlag(env.DOTNET_PUBLISH_NO_BUILD),
        noRestore: env.resolveFlag(env.DOTNET_PUBLISH_NO_RESTORE),
        target: "[ not set ]", // intentional: piping through gulp will set this, per project
        verbosity: env.resolve(env.DOTNET_PUBLISH_VERBOSITY) as DotNetVerbosity,
        msbuildProperties: env.resolveMap(env.MSBUILD_PROPERTIES),
        publishContainer: env.resolveFlag(env.DOTNET_PUBLISH_CONTAINER),
        containerImageName: env.resolve(env.DOTNET_PUBLISH_CONTAINER_IMAGE_NAME),
        containerImageTag: env.resolve(env.DOTNET_PUBLISH_CONTAINER_IMAGE_TAG),
        containerRegistry: env.resolve(env.DOTNET_PUBLISH_CONTAINER_REGISTRY)
        // TODO: include env drivers for msbuild props:
        // PublishTrimmed
        // PublishSingleFile
        // IncludeNativeLibrariesForSelfExtract
        // DebugType (perhaps DOTNET_PUBLISH_DEBUG=None?)
        // DebugSymbols (flag - False)
        // EnableCompressionInSingleFile (flag - True)
        // -> perhaps DOTNET_PUBLISH_SELF_CONTAINED should set these appropriately, with opt-out via env vars
      };


      const publishMasks = resolveMasks(
        env.DOTNET_PUBLISH_INCLUDE,
        [ env.DOTNET_PUBLISH_EXCLUDE, env.DOTNET_PUBLISH_ADDITIONAL_EXCLUDE ]
      );
      return gulp
        .src(publishMasks)
        .pipe(
          publish(publishOpts)
        );
    }
  );
})();
