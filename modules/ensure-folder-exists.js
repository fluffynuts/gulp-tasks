const
  fs = require("fs"),
  debug = require("debug")("ensure-folder-exists")

module.exports = function ensureFolderExists(folder) {
  debug(`Ensuring existence of tools folder "${folder}"`);
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }
      debug(`${folder} exists!`);
      resolve();
    } catch (e) {
      debug(`${folder} doesn't exist and not creatable`);
      debug(e);
      reject(e);
    }
  });
}

