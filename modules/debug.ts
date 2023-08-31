(function() {
  const
    path = require("path"),
    { fileExistsSync } = require("yafs"),
    originalDebugFactory = require("debug");

  function simplifyFilePath(label: string): string {
    if (!fileExistsSync(label)) {
      return label;
    }
    const
      basename = path.basename(label);
    return basename.replace(/\.(js|ts)$/i, "");
  }

  module.exports = function debugFactory(
    label: string
  ): DebugLogFunction {
    return originalDebugFactory(`zarro::${simplifyFilePath(label)}`);
  };
})();
