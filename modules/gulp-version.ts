(function() {
  const gulpInfo = require("gulp/package.json"),
    parts = gulpInfo.version.split(".").map(
      (s: string) => parseInt(s, 10)
    );

  module.exports = {
    major: parts[0],
    minor: parts[1],
    patch: parts[2]
  };
})();
