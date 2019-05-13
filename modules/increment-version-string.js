function testNaN(version) {
  Object.keys(version).forEach(k => {
    if (isNaN(version[k])) {
      throw new Error(`${k} is not an integer`);
    }
  });
}

module.exports = function incrementVersion(versionString) {
  const parts = versionString.split("."),
    major = parseInt(parts[0]),
    minor = parseInt(parts[1]),
    patch = parseInt(parts[2]);
  testNaN({ major, minor, patch });
  return `${major}.${minor}.${patch + 1}`;
};
