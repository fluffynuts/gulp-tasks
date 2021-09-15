const
  env = requireModule("env"),
  gulp = requireModule("gulp"),
  debug = require("debug")("nuget-restore"),
  nugetRestore = requireModule("./gulp-nuget-restore"),
  promisify = requireModule("promisify"),
  resolveMasks = requireModule("resolve-masks"),
  { ZarroError } = requireModule("zarro-error"),
  findLocalNuget = requireModule("find-local-nuget");

const myTasks = [ "nuget-restore" ],
  myVars = [
    "DOTNET_CORE",
    "BUILD_INCLUDE",
    "BUILD_EXCLUDE",
    "BUILD_ADDITIONAL_EXCLUDE"
  ];
env.associate(myVars, myTasks);

gulp.task(
  "nuget-restore",
  "Restores all nuget packages in all solutions",
  [ "install-tools" ],
  async () => {
    const
      allDNC = env.resolveFlag("DOTNET_CORE"),
      slnMasks = resolveMasks("BUILD_INCLUDE", [ "BUILD_EXCLUDE", "BUILD_EXTRA_EXCLUDE" ]);
    debug({
      allDNC,
      slnMasks,
      cwd: process.cwd()
    });
    var options = {
      debug: false
    };
    const start = allDNC
      ? Promise.resolve()
      : findLocalNuget();
    if (allDNC) {
      options.nuget = "dotnet";
    }
    return start.then(() => {
      return promisify(
        gulp
          .src(slnMasks, { allowEmpty: true })
          .pipe(
            nugetRestore(options)
          )
      ).then(() => {
        debug("nuget restore complete!");
      }).catch(e => {
        console.error("nugetRestore errs:", e);
        throw new ZarroError(e);
      });
    });
  }
);
