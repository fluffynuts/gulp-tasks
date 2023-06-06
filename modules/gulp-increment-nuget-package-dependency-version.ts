(function() {
  const
    gutil = requireModule<GulpUtil>("gulp-util"),
    env = requireModule<Env>("env"),
    editXml = require("gulp-edit-xml"),
    incrementVersion = requireModule<IncrementVersion>("increment-version");

  module.exports = function incrementDependencyVersion(
    packageMatch: RegExp | string
  ) {
    if (typeof packageMatch === "string") {
      packageMatch = new RegExp(`^${packageMatch}$`);
    }
    return editXml(
      (xml: any) => {
        const
          meta = xml.package.metadata[0],
          packageId = meta.id[0],
          dependencies = meta.dependencies[0].group;
        for (const dep of dependencies) {
          const dependency = (dep.dependency || [])[0];
          if (!dependency) {
            return;
          }
          if ((dependency.$.id || "").match(packageMatch)) {
            const newVersion = incrementVersion(
              dependency.$.version,
              env.resolve("VERSION_INCREMENT_STRATEGY"),
              env.resolveFlag("VERSION_INCREMENT_ZERO"),
              env.resolveNumber("PACK_INCREMENT_VERSION_BY")
            );
            gutil.log(
              gutil.colors.yellow(
                `${ packageId }: dependency ${
                  dependency.$.id
                } version incremented to: ${ newVersion }`
              )
            );
            dependency.$.version = newVersion;
          }
        }
        return xml;
      },
      {
        builderOptions: { renderOpts: { pretty: true } }
      }
    );
  };

})();
