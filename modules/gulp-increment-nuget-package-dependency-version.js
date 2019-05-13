const
  gutil = require("gulp-util"),
  editXml = require("gulp-edit-xml"),
  incrementVersion = require("./increment-version-string");

module.exports = function incrementDependencyVersion(packageMatch) {
  if (typeof packageMatch === "string") {
    packageMatch = new RegExp(`^${packageMatch}$`);
  }
  return editXml(
    xml => {
      const
        meta = xml.package.metadata[0],
        packageId = meta.id[0],
        dependencies = meta.dependencies[0].group;
      dependencies.forEach(dep => {
        var dependency = (dep.dependency || [])[0];
        if (!dependency) {
          return;
        }
        if ((dependency.$.id || "").match(packageMatch)) {
          const newVersion = incrementVersion(dependency.$.version);
          gutil.log(
            gutil.colors.yellow(
              `${packageId}: dependency ${
                dependency.$.id
              } version incremented to: ${newVersion}`
            )
          );
          dependency.$.version = newVersion;
        }
      });
      return xml;
    },
    {
      builderOptions: { renderOpts: { pretty: true } }
    }
  );
}

