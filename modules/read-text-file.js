const fs = require("fs").promises;

module.exports = async function readTextFile(path) {
  const buffer = await fs.readFile(path, { encoding: "utf8" });
  return buffer.toString();
};
