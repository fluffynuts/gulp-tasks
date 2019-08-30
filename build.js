const os = require("os"),
  env = requireModule("env"),
  gulp = requireModule("gulp-with-help"),
  getToolsFolder = requireModule("get-tools-folder"),
  promisifyStream = requireModule("promisify"),
  areAllDotnetCore = requireModule("are-all-dotnet-core"),
  { clean, build } = require("gulp-dotnet-cli"),
  throwIfNoFiles = requireModule("throw-if-no-files"),
  xbuild = requireModule("gulp-xbuild"),
  gutil = requireModule("gulp-util"),
  log = requireModule("log"),
  msbuild = require("gulp-msbuild");

gulp.task("prebuild", ["nuget-restore"]);

const myTasks = ["build"],
  myVars = [
    "BUILD_CONFIGURATION",
    "BUILD_PLATFORM",
    "BUILD_ARCHITECTURE",
    "BUILD_TARGETS",
    "BUILD_TOOLSVERSION",
    "BUILD_VERBOSITY"
  ];
env.associate(myVars, myTasks);

gulp.task(
  "build",
  "Builds all Visual Studio solutions in tree",
  ["prebuild"],
  async () => {
    const solutions = gulp.src([
      "**/*.sln",
      "!**/node_modules/**/*.csproj",
      `!./${getToolsFolder()}/**/*.csproj`
    ]);

    const useDotNetBuild = await areAllDotnetCore([
      "**/*.csproj",
      "!**/node_modules/**/*.sln",
      `!./${getToolsFolder()}/**/*.csproj`
    ]);

    log.info(
      gutil.colors.yellow(
        useDotNetBuild
          ? "Building with dotnet core"
          : "Building with full framework"
      )
    );

    return useDotNetBuild
      ? buildForNetCore(solutions)
      : buildForNETFramework(solutions);
  }
);

function check() {
  return throwIfNoFiles("No .sln files found");
}

function buildForNetCore(solutions) {
  const configuration = process.env.BUILD_CONFIGURATION || "Debug";
  return promisifyStream(
    solutions
      .pipe(check())
      .pipe(
        clean({
          configuration
        })
      )
      .pipe(
        build({
          verbosity: "minimal",
          configuration
        })
      )
  );
}

function buildForNETFramework(solutions) {
  const builder = os.platform() === "win32" ? msbuild : xbuild;
  return promisifyStream(
    solutions.pipe(check()).pipe(
      builder({
        toolsVersion: env.resolve("BUILD_TOOLSVERSION"),
        targets: env.resolveArray("BUILD_TARGETS"),
        configuration: env.resolve("BUILD_CONFIGURATION"),
        stdout: true,
        verbosity: env.resolve("BUILD_VERBOSITY"),
        errorOnFail: true,
        solutionPlatform: env.resolve("BUILD_PLATFORM"),
        // NB: this is the MSBUILD architecture, NOT your desired output architecture
        architecture: env.resolve("BUILD_ARCHITECTURE"),
        nologo: false
      })
    )
  );
}
