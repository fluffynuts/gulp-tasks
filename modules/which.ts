(function() {
  const _which_ = require("which");

  module.exports = function which(
    executable: string
  ): Optional<string> {
    try {
      return _which_.sync(executable);
    } catch (e) {
      return undefined;
    }
  }
})();
