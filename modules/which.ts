(function() {
  const _which_ = require("which");

  module.exports = function which(
    executable: string
  ): Nullable<string> {
    try {
      return _which_.sync(executable);
    } catch (e) {
      return null;
    }
  }
})();
