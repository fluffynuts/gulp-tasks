import { tryReadVersionFrom } from "./version-reading-shared";

(function() {
  const
    { ZarroError } = requireModule("zarro-error"),
    parseXml = requireModule<ParseXml>("parse-xml"),
    readTextFile = requireModule<ReadTextFile>("read-text-file");

  module.exports = async function readProjectVersion(pathToCsProj: string) {
    const
      contents = await readTextFile(pathToCsProj),
      doc = await parseXml(contents);

    try {
      const
        propertyGroups = doc.Project.PropertyGroup;
      return tryReadVersionFrom(propertyGroups, "PackageVersion");
    } catch (e) {
      throw new ZarroError(
        `Unable to read any xml node Project/PropertyGroup/PackageVersion in file ${ pathToCsProj }`
      );
    }
  }
})();

export {};
