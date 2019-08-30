const
  resolveMasks = require("./resolve-masks");

module.exports = function resolveTestMasks() {
  return resolveMasks("TEST_INCLUDE", "TEST_EXCLUDE");
}
