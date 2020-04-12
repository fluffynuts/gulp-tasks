import "../../interfaces";

const
  readTextFile = requireModule<ReadTextFile>("read-text-file");

module.exports = async function readPackageVersion(packageJsonFile) {
  const
    json = await readTextFile(packageJsonFile || "package.json"),
    index = JSON.parse(json);
  return index.version;
}
