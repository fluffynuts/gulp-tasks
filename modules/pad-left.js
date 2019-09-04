const pad = require("./pad");
module.exports = function padLeft(str, length, padString) {
  return pad(str, length, false, padString);
}
