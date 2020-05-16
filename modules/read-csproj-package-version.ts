(function() {
  const
    parseXml = requireModule<ParseXml>("parse-xml"),
    readTextFile = requireModule<ReadTextFile>("read-text-file");

  function readTextFrom(node: string[]): string | undefined {
    return node
      ? node[0]
      : undefined;
  }

  module.exports = async function readNuspecVersion(pathToCsProj: string) {
    const
      contents = await readTextFile(pathToCsProj),
      doc = await parseXml(contents);

    try {
      const
        propertyGroups = doc.Project.PropertyGroup;
      return propertyGroups.reduce(
        (acc: string | undefined, cur: any) => acc || readTextFrom(cur.PackageVersion),
        undefined
      );
    } catch (e) {
      throw new Error(
        `Unable to read any xml node Project/PropertyGroup/PackageVersion in file ${ pathToCsProj }`
      );
    }
  }
})();

export {};
