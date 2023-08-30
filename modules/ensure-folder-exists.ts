(function () {
  const
    { mkdir, mkdirSync } = require("yafs"),
    debug = requireModule<DebugFactory>("debug")(__filename);

  async function ensureFolderExists(folder: string) {
    debug(`Ensuring existence of folder "${folder}"`);
    await mkdir(folder);
  }

  function ensureFolderExistsSync(folder: string) {
    mkdirSync(folder);
  }

  ensureFolderExists.sync = ensureFolderExistsSync;

  module.exports = ensureFolderExists;
})();
