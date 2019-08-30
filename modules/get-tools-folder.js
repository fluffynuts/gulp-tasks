var
  env = require("./env"),
  debug = require("debug")("get-tools-folder");
function getToolsFolder() {
  var result = env.resolve("BUILD_TOOLS_FOLDER");
  debug("-> getting tools from: ", result);
  return result;
}

module.exports = getToolsFolder;
