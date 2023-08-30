(function () {
  const
    chalk = requireModule<AnsiColors>("ansi-colors"),
    env = requireModule<Env>("env"),
    gulp = requireModule<Env>("gulp"),
    debug = requireModule<DebugFactory>("debug")(__filename),
    nugetRestore = requireModule<GulpNugetRestore>("./gulp-nuget-restore"),
    promisify = requireModule<PromisifyStream>("promisify-stream"),
    resolveMasks = requireModule<ResolveMasks>("resolve-masks"),
    tryDo = requireModule<TryDo<any>>("try-do"),
    findLocalNuget = requireModule<FindLocalNuget>("find-local-nuget");

  const myTasks = [ "nuget-restore" ],
    myVars = [
      "DOTNET_CORE",
      "BUILD_INCLUDE",
      "BUILD_EXCLUDE",
      "BUILD_ADDITIONAL_EXCLUDE",
      "RESTORE_RETRIES"
    ];
  env.associate(myVars, myTasks);

  gulp.task(
    "nuget-restore",
    "Restores all nuget packages in all solutions",
    [ "install-tools" ],
    tryRestore
  );

  async function tryRestore() {
    await tryDo(
      restore,
      "RESTORE_RETRIES",
      e => console.error(chalk.red(`Clean fails: ${e}`))
    );
  }

  async function restore() {
    const
      allDNC = env.resolveFlag("DOTNET_CORE"),
      slnMasks = resolveMasks("BUILD_INCLUDE", [ "BUILD_EXCLUDE", "BUILD_EXTRA_EXCLUDE" ]);
    debug({
      allDNC,
      slnMasks,
      cwd: process.cwd()
    });
    const options = {
      debug: false
    } as NugetRestoreOptions;
    const start = allDNC
      ? () => Promise.resolve()
      : findLocalNuget;
    if (allDNC) {
      options.nuget = "dotnet";
    }
    await start();
    await promisify(
      gulp.src(slnMasks, { allowEmpty: true })
        .pipe(
          nugetRestore(options)
        )
    );
    debug("nuget restore complete!");
  }
})();
