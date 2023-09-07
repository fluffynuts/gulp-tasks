(function() {

  const os = require("os");

  module.exports = function quoteIfRequired(arg: string): string {
    arg = `${arg}`;
    const hasSemiColon = arg.indexOf(";") > -1;
    if (!hasWhitespace(arg) && !hasSemiColon) {
      return arg;
    }
    const alreadyWrapped = arg.match(/^".*"$/);
    if (alreadyWrapped) {
      return arg;
    }
    if (isWhackyDOSQuoting(arg)) {
      return arg;
    }
    return `"${escapeQuotes(arg)}"`;
  }

  function escapeQuotes(str: string): string {
    if (os.platform() === "win32") {
      return str;
    }
    return str.replace(/"/g, `\\"`);
  }

  function hasWhitespace(arg: string): boolean {
    return !!arg.match(/\s+/);
  }

  function isWhackyDOSQuoting(str: string): boolean {
    if (os.platform() !== "win32") {
      return false;
    }
    if (str.indexOf(`"`) === -1) {
      return false;
    }
    const parts = str.split('"');
    return !hasWhitespace(parts[0]);
  }

})();
