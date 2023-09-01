(function() {
  const Version = requireModule<Version>("version");

  function parseNugetVersion(
    versionStringOrFileName: string
  ): PackageInfo {
    const
      withoutExtension = versionStringOrFileName.replace(/\.nupkg$/, ""),
      packageWithVersionAndTag = withoutExtension.split("-"),
      packageWithVersionParts = packageWithVersionAndTag[0].split("."),
      idAndVersion = collect(packageWithVersionParts);
    return new PackageVersionInfo(
      idAndVersion.id,
      new Version(
        idAndVersion.version[0] || 0,
        idAndVersion.version[1] || 0,
        idAndVersion.version[2] || 0,
        packageWithVersionAndTag[1] || ""
      )
    );
  }

  class PackageVersionInfo implements PackageInfo {
    get isPreRelease() {
      return this.version?.isPreRelease ?? true;
    }
    constructor(
      public id: string,
      public version: Version
    ) {
    }
  }

  function collect(stringParts: string[]) {
    // moving in from the right, any pure number becomes part of the version, then the
    // rest is package identifier parts
    const
      idParts = [] as string[],
      versionParts = [] as number[];
    stringParts.reverse();
    let inVersion = true;
    for (const part of stringParts) {
      if (inVersion) {
        const asNum = parseInt(part);
        if (isNaN(asNum)) {
          idParts.push(part);
          inVersion = false;
        } else {
          versionParts.push(asNum);
        }
      } else {
        idParts.push(part);
      }
    }

    idParts.reverse();
    versionParts.reverse();
    return {
      id: idParts.join("."),
      version: versionParts
    };
  }

  module.exports = {
    parseNugetVersion
  };
})();
