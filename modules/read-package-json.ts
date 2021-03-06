(function() {
  const
    fs = require("./fs"),
    readTextFile = require("./read-text-file"),
    path = require("path");
  module.exports = async function readPackageJson(at?: string): Promise<PackageIndex> {
    if (at) {
      if (await fs.isFolder(at)) {
        at = path.join(at, "package.json");
      }
      if (!(await fs.isFile(at))) {
        throw new Error(`File not found: ${at}`);
      }
    }
    const
      pkgFile = path.join(at ?? "package.json"),
      text = await readTextFile(pkgFile);
    return JSON.parse(text);
  }
})();

