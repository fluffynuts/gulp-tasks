var defaultToolsLocation = "tools";
function getToolsFolder() {
  return process.env.BUILD_TOOLS_FOLDER || defaultToolsLocation;
}

module.exports = getToolsFolder;