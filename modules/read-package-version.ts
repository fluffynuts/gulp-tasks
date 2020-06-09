(function () {
  const
    readPackageJson = requireModule<ReadPackageJson>("read-package-json");

  module.exports = async function readPackageVersion(packageJsonFile: string) {
    const
      index = await readPackageJson(packageJsonFile || "package.json");
    return index.version;
  }
})();
