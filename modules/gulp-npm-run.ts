(function() {
  const
    { readFileSync } = require("fs"),
    exec = require("./exec") as Exec,
    path = require("path"),
    findNpmBase = require("./find-npm-base");

  function gulpNpmRun(gulp: GulpWithHelp) {
    const
      packageIndex = findPackageIndex(),
      scripts = packageIndex.scripts || {};
    Object.keys(scripts).forEach(k => {
      gulp.task(k, `npm script: ${k}`, async () => {
        await exec("npm", [ "run", k ]);
      });
    });
  }

  function findPackageIndex(): PackageIndex {
    const
      packageIndexFolder = findNpmBase(),
      packageIndexPath = path.join(packageIndexFolder, "package.json");
    try {
      const contents =  readFileSync(packageIndexPath, { encoding: "utf8" });
      return JSON.parse(contents);
    } catch (e) {
      throw new Error(`Unable to read package.json at ${packageIndexPath}`);
    }
  }

  module.exports = gulpNpmRun;
})();
