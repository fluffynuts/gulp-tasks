const
  getToolsFolder = requireModule("get-tools-folder"),
  throwIfNoFiles = requireModule("throw-if-no-files"),
  dotnetCli = require("gulp-dotnet-cli"),
  dotnetPack = dotnetCli.pack,
  env = requireModule("env"),
  fs = requireModule("fs"),
  del = require("del"),
  gulp = requireModule("gulp-with-help"),
  pack = requireModule("gulp-nuget-pack");

env.associate(["PACKAGE_TARGET_FOLDER", "DOTNET_CORE"], ["pack"]);

gulp.task(
  "pack",
  "Creates nupkgs from all nuspec files in this repo",
  gulp.series("build", "prepack"), () => {
    const
      target = env.resolve("PACKAGE_TARGET_FOLDER"),
      isDotnetCore = env.resolveFlag("DOTNET_CORE");

    return isDotnetCore
      ? packWithDotnetCore(target)
      : packWithNuget(target);
});

function packWithNuget(target) {
    return gulp.src([
      "**/*.nuspec",
      `!${getToolsFolder()}/**/*`
    ])
    .pipe(throwIfNoFiles("No nuspec files found"))
    .pipe(pack())
    .pipe(target);
}

function packWithDotnetCore(target) {
  const
    projects = env.resolveArray("PACK_TARGETS")
      .map(locateProject);

}

function locateProject(name) {
  throw new Error("dotnet pack not fully implemented yet");
}


gulp.task(
  "prepack",
  "Skeleton task which you can replace to run logic just before packing", () => Promise.resolve()
);

gulp.task("clean-packages",
  "Removes any existing package artifacts", async () => {
    const packageFolder = process.env.PACKAGE_TARGET_FOLDER || "packages";
    await del(packageFolder)
    await fs.ensureDirectoryExists(packageFolder);
});
