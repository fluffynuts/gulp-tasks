const
  getToolsFolder = requireModule("get-tools-folder"),
  throwIfNoFiles = requireModule("throw-if-no-files"),
  fs = requireModule("fs"),
  del = require("del"),
  gulp = requireModule("gulp-with-help"),
  pack = requireModule("gulp-nuget-pack");

gulp.task(
  "pack",
  "Creates nupkgs from all nuspec files in this repo",
  ["build"], () => {
    return gulp.src([
      "**/*.nuspec",
      `!${getToolsFolder()}/**/*`
    ])
    .pipe(throwIfNoFiles("No nuspec files found"))
    .pipe(pack())
    .pipe(gulp.dest(process.env.PACKAGE_TARGET_FOLDER || "packages"));
});

gulp.task("clean-packages",
  "Removes any existing package artifacts", async () => {
    const packageFolder = process.env.PACKAGE_TARGET_FOLDER || "packages";
    await del(packageFolder)
    await fs.ensureDirectoryExists(packageFolder);
});
