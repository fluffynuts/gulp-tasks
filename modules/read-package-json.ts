
(function() {
    const
        { folderExists, readTextFile, fileExists } = require("yafs"),
        ZarroError = requireModule<ZarroError>("zarro-error"),
        path = require("path");
    module.exports = async function readPackageJson(at?: string): Promise<PackageIndex> {
        if (at) {
            if (await folderExists(at)) {
                at = path.join(at, "package.json");
            }
            if (!(await fileExists(at))) {
                throw new ZarroError(`File not found: ${ at }`);
            }
        }
        const
            pkgFile = path.join(at ?? "package.json"),
            text = await readTextFile(pkgFile);
        return JSON.parse(text);
    }
})();

