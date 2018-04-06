var
  debug = require("debug")("get-tools-folder"),
  defaultToolsLocation = "tools";
function getToolsFolder() {
  var result = process.env.BUILD_TOOLS_FOLDER || defaultToolsLocation;
  debug("-> getting tools from: ", result);
  return result;
}

module.exports = getToolsFolder;