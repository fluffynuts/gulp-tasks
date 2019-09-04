const pad = require("./pad");
module.exports = function padRight(str, len, padString) {
  return pad(str, len, true, padString);
}
