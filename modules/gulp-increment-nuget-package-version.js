const
  gutil = require("gulp-util"),
  editXml = require("gulp-edit-xml"),
  incrementVersion = require("./increment-version-string");


module.exports = function incrementPackageVersion() {
  return editXml(
    xml => {
      const meta = xml.package.metadata[0],
        packageName = meta.id[0],
        node = meta.version,
        current = node[0];
      const newVersion = incrementVersion(current);
      node[0] = newVersion;
      gutil.log(
        gutil.colors.yellow(
          `${packageName}: package version incremented to: ${newVersion}`
        )
      );
      return xml;
    },
    { builderOptions: { renderOpts: { pretty: true } } }
  );
}
