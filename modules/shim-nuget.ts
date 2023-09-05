(function() {
  const
    os = require("os"),
    path = require("path"),
    { fileExistsSync, writeTextFileSync, chmodSync } = require("yafs"),
    isWindows = os.platform() === "win32";

  function shimNuget(pathToNuget: string): string {
    if (!fileExistsSync(pathToNuget)) {
      throw new Error(`file not found: ${pathToNuget}`);
    }
    if (isWindows) {
      return pathToNuget;
    }
    const ext = path.extname(pathToNuget);
    if (!ext) {
      // provided path is already a shim;
      return pathToNuget;
    }
    const
      folder = path.dirname(pathToNuget),
      shim = path.join(folder, "nuget");
    if (fileExistsSync(shim)) {
      return shim;
    }
    writeTextFileSync(
      shim, `#!/bin/sh
mono $(dirname $0)/nuget.exe $*
`);
    chmodSync(shim, "777");
    return shim;
  }

  module.exports = shimNuget;
})();
