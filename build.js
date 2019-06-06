const gulp = requireModule("gulp-with-help"),
  getToolsFolder = requireModule("get-tools-folder"),
  promisifyStream = requireModule("promisify"),
  areAllDotnetCore = requireModule("are-all-dotnet-core"),
  { clean, build } = require("gulp-dotnet-cli"),
  throwIfNoFiles = requireModule("throw-if-no-files"),
  msbuild = require("gulp-msbuild");

gulp.task("prebuild", ["nuget-restore"]);

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
  return promisifyStream(
    solutions.pipe(check()).pipe(
      msbuild({
        toolsVersion: "auto",
        targets: ["Clean", "Build"],
        configuration: process.env.BUILD_CONFIGURATION || "Debug",
        stdout: true,
        verbosity: "minimal",
        errorOnFail: true,
        solutionPlatform: process.env.BUILD_PLATFORM || "Any CPU",
        // NB: this is the MSBUILD architecture, NOT your desired output architecture
        architecture: process.env.BUILD_ARCHITECTURE || "x64",
        nologo: false
      })
    )
  );
}
