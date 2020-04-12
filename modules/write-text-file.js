const fs = require("fs").promises;

module.exports = async function(
  path,
  data,
  options) {
  options = options || {};
  options.encoding = "utf8";
  return await fs.writeFile(path, data, options)
};
