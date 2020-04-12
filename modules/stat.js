const fs = require("fs").promises;
module.exports = async function(path) {
  try {
    return await fs.stat(path);
  } catch (e) {
    return null;
  }
};
