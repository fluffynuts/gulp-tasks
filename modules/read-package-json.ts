(function() {
  const
    fs = require("./fs"),
    readTextFile = require("./read-text-file"),
    { ZarroError } = requireModule("zarro-error"),
    path = require("path");
  module.exports = async function readPackageJson(at?: string): Promise<PackageIndex> {
    if (at) {
      if (await fs.isFolder(at)) {
        at = path.join(at, "package.json");
      }
      if (!(await fs.isFile(at))) {
        throw new ZarroError(`File not found: ${at}`);
      }
    }
    const
      pkgFile = path.join(at ?? "package.json"),
      text = await readTextFile(pkgFile);
    return JSON.parse(text);
  }
})();

