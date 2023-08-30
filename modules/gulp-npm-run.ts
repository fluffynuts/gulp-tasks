import { fi } from "@faker-js/faker";

(function() {
  // replaces the gulp-npm-run node module
  // which relies on ramda -- that keeps on having
  // breaking changes released. NO MORE.
  const
    { readFileSync } = require("fs"),
    debug = requireModule<DebugFactory>("debug")(__filename),
    exec = requireModule<Exec>("exec"),
    path = require("path"),
    chalk = requireModule<AnsiColors>("ansi-colors"),
    ZarroError = requireModule<ZarroError>("zarro-error"),
    findNpmBase = requireModule<FindNpmBase>("find-npm-base");

  function gulpNpmRun(gulp: GulpWithHelp) {
    const
      packageIndex = findPackageIndex(),
      scripts = packageIndex.scripts || {};
    Object.keys(scripts).forEach(k => {
      gulp.task(k, `npm script: ${k}`, async () => {
        // npm run produces extra output, prefixed with >
        // at the start, including package information and the script line
        // -> we'll ignore it unless someone _really_ wants it
        let ignoredFirstLine = false;
        await exec("npm", [ "run", k ], undefined, {
          stderr: (d: string) => console.error(chalk.red(d)),
          stdout: (d: string) => {
            if (!ignoredFirstLine) {
              debug(`npm diagnostics:\n${d}`);
              ignoredFirstLine = true;
              return;
            }
            console.log(chalk.yellow(d))
          }
        });
      });
    });
  }

  function findPackageIndex(): PackageIndex {
    const
      packageIndexFolder = findNpmBase(),
      packageIndexPath = path.join(packageIndexFolder, "package.json");
    try {
      const contents = readFileSync(packageIndexPath, { encoding: "utf8" });
      return JSON.parse(contents);
    } catch (e) {
      throw new ZarroError(`Unable to read package.json at ${packageIndexPath}`);
    }
  }

  module.exports = gulpNpmRun;
})();
