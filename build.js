const gulp = requireModule("gulp-with-help"),
  getToolsFolder = requireModule("get-tools-folder"),
  areAllDotnetCore = requireModule("are-all-dotnet-core"),
  { clean, build } = require("gulp-dotnet-cli"),
  msbuild = require("gulp-msbuild");

gulp.task("prebuild", ["nuget-restore"]);

gulp.task(
  "build",
  "Builds all Visual Studio solutions in tree",
  ["prebuild"],
  async () => {
    const solutions = gulp.src([
      "**/*.sln",
      "!**/node_modules/**/*.sln",
      `!./${getToolsFolder()}/**/*.sln`
    ]);
    return await areAllDotnetCore([
      "**/*.csproj",
      "!**/node_modules/**/*.sln",
      `!./${getToolsFolder()}/**/*.csproj`
    ]) ? solutions
          .pipe(clean())
          .pipe(build())
       : solutions.pipe(
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
        );
  }
);
