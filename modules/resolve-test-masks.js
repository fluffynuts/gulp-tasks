const resolveMasks = require("./resolve-masks");

module.exports = function resolveTestMasks(dotnetCore) {
  return resolveMasks("TEST_INCLUDE", "TEST_EXCLUDE", p =>
    dotnetCore ? `${p}.csproj` : `${p}.dll`
  );
};
