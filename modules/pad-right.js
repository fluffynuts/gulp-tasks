const pad = require("./pad");
module.exports = function padRight(str, len) {
  return pad(str, len, true);
}
