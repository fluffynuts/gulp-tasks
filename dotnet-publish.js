const
  { publish } = requireModule("gulp-dotnet-cli"),
  /**
   * @type Env
   */
  env = requireModule("env"),
  gulp = requireModule("gulp");

env.associate([
  "DOTNET_PUBLISH_BUILD_CONFIGURATION",
  "DOTNET_PUBLISH_RUNTIMES",
  "OUTPUT",
  "DOTNET_DISABLE_BUILD_SERVERS",
  "DOTNET_PUBLISH_VERSION_SUFFIX",
  "DOTNET_PUBLISH_SELF_CONTAINED",
  "DOTNET_PUBLISH_MANIFEST",
  "DOTNET_PUBLISH_USE_CURRENT_RUNTIME",
  "DOTNET_PUBLISH_ARCH",
  "DOTNET_PUBLISH_OS",
  "DOTNET_PUBLISH_FRAMEWORK",
  "DOTNET_PUBLISH_NO_BUILD",
  "DOTNET_PUBLISH_NO_RESTORE",
  "DOTNET_PUBLISH_VERBOSITY",
  "MSBUILD_PROPERTIES"
], "dotnet-publish");

gulp.task(
  "dotnet-publish",
  "Performs `dotnet publish` on all non-test projects in the tree",
  () => {
    /**
     * @type DotNetPublishOptions
     */
    const publishOpts = {
      configuration: env.resolve("DOTNET_PUBLISH_BUILD_CONFIGURATION", "BUILD_CONFIGURATION"),
      runtime: env.resolve("DOTNET_PUBLISH_RUNTIMES"),
      output: env.resolve("OUTPUT"),
      disableBuildServers: env.resolveFlag("DOTNET_DISABLE_BUILD_SERVERS"),
      versionSuffix: env.resolve("DOTNET_PUBLISH_VERSION_SUFFIX"),
      selfContained: env.resolveFlag("DOTNET_PUBLISH_SELF_CONTAINED"),
      manifest: env.resolve("DOTNET_PUBLISH_MANIFEST"),
      useCurrentRuntime: env.resolveFlag("DOTNET_PUBLISH_USE_CURRENT_RUNTIME"),
      arch: env.resolve("DOTNET_PUBLISH_ARCH"),
      os: env.resolve("DOTNET_PUBLISH_OS"),
      framework: env.resolve("DOTNET_PUBLISH_FRAMEWORK"),
      noBuild: env.resolveFlag("DOTNET_PUBLISH_NO_BUILD"),
      noRestore: env.resolveFlag("DOTNET_PUBLISH_NO_RESTORE"),
      target: "[ not set ]",
      verbosity: env.resolve("DOTNET_PUBLISH_VERBOSITY"),
      msbuildProperties: env.resolveMap("MSBUILD_PROPERTIES")
    };

    // TODO: add in publish opts
    // DOTNET_PUBLISH_CONTAINER (flag)
    // DOTNET_PUBLISH_CONTAINER_REGISTRY (string)
    // DOTNET_PUBLISH_CONTAINER_IMAGE_TAG (string)
    // DOTNET_PUBLISH_CONTAINER_IMAGE_NAME (string)
    // issue warnings, unless suppressed (DOTNET_PUBLISH_SUPPRESS_WARNINGS (flag))

    const testInclusionsInverted = env.resolveArray("TEST_INCLUDE")
      .map(p => `!${p}.csproj`);
    return gulp
      .src([ "**/*.csproj" ].concat(testInclusionsInverted))
      .pipe(
        publish(publishOpts)
      );
  }
);
