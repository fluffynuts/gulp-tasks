(function() {
  const
    parseXml = requireModule<ParseXml>("parse-xml"),
    fallbackAssemblyVersion = "1.0.0",
    path = require("path"),
    readTextFile = requireModule<ReadTextFile>("read-text-file");


  async function readProjectVersion(pathToCsProj: string) {
    const
      contents = await readTextFile(pathToCsProj),
      doc = await parseXml(contents);

    try {
      const
        propertyGroups = doc.Project.PropertyGroup
      return tryReadNodeFrom(propertyGroups, "Version") ?? fallbackAssemblyVersion;
    } catch (e) {
      return fallbackAssemblyVersion;
    }
  }

  async function readPackageVersion(pathToCsProj: string) {
    const
      contents = await readTextFile(pathToCsProj),
      doc = await parseXml(contents);

    try {
      const
        propertyGroups = doc.Project.PropertyGroup
      return tryReadNodeFrom(propertyGroups, "PackageVersion") ?? fallbackAssemblyVersion;
    } catch (e) {
      return fallbackAssemblyVersion;
    }
  }

  async function readAssemblyVersion(pathToCsProj: string) {
    const
      contents = await readTextFile(pathToCsProj),
      doc = await parseXml(contents);

    try {
      const
        propertyGroups = doc.Project.PropertyGroup
      return tryReadNodeFrom(propertyGroups, "AssemblyVersion")
        ?? fallbackAssemblyVersion;
    } catch (e) {
      return fallbackAssemblyVersion;
    }
  }

  function determineAssemblyNameFromProjectPath(
    pathToCsProj: string
  ): string {
    const
      basename = path.basename(pathToCsProj);
    return basename.replace(/\.csproj$/i, "");
  }

  async function readAssemblyName(pathToCsProj: string) {
    const
      contents = await readTextFile(pathToCsProj),
      doc = await parseXml(contents);

    try {
      const
        propertyGroups = doc.Project.PropertyGroup
      return tryReadNodeFrom(propertyGroups, "AssemblyName")
        ?? determineAssemblyNameFromProjectPath(pathToCsProj);
    } catch (e) {
      return fallbackAssemblyVersion;
    }
  }

  function readTextFrom(node: string[]): string | undefined {
    return node
      ? node[0]
      : undefined;
  }

  function tryReadNodeFrom(
    groups: any[],
    nodeName: string
  ): string | undefined {
    return groups.reduce(
      (acc: string | undefined, cur: any) =>
        acc || readTextFrom(cur[nodeName]),
      undefined
    );
  }

  module.exports = {
    readProjectVersion,
    readAssemblyVersion,
    readPackageVersion,
    readAssemblyName
  };
})();
