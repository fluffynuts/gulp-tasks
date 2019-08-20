const pad = require("./pad");
module.exports = function padLeft(str, length) {
  return pad(str, length, false);
}
