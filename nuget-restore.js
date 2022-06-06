const
  chalk = require("ansi-colors"),
  env = requireModule("env"),
  gulp = requireModule("gulp"),
  debug = require("debug")("nuget-restore"),
  nugetRestore = requireModule("./gulp-nuget-restore"),
  promisify = requireModule("promisify"),
  resolveMasks = requireModule("resolve-masks"),
  { ZarroError } = requireModule("zarro-error"),
  tryDo = requireModule("try-do"),
  findLocalNuget = requireModule("find-local-nuget");

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
  tryDo(
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
  };
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
