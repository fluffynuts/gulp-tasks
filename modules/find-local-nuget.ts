(function () {
  const
    path = require("path"),
    log = requireModule<Log>("log"),
    { fileExists, writeTextFile, chmod } = require("yafs"),
    os = require("os"),
    resolveNuget = require("./resolve-nuget"),
    pathUnquote = require("./path-unquote"),
    downloadNuget = require("./download-nuget"),
    env = require("./env");

  let
    startedDownload = false,
    resolver = (_: string) => {
    },
    lastResolution = new Promise<string>(function (resolve) {
      resolver = resolve;
    });

  async function findLocalNuget(): Promise<string> {
    const
      targetFolder = env.resolve("BUILD_TOOLS_FOLDER"),
      localNuget = resolveNuget(undefined, false) || path.join(targetFolder, "nuget.exe");
    if (startedDownload) {
      return lastResolution;
    }
    if (await fileExists(pathUnquote(localNuget))) {
      return localNuget;
    }
    startedDownload = true;
    try {
      const result = await downloadNuget(targetFolder);
      resolver(result); // catch up any other code waiting on this
      return result;
    } catch (err) {
      if (await fileExists(localNuget)) {
        log.info(err);
        log.info("Falling back on last local nuget.exe");
        const result = await resolveShimIfRequired(
          localNuget
        );
        resolver(result);
        return result;
      }
      throw err;
    }
  }

  async function resolveShimIfRequired(
    nuget: string
  ): Promise<string> {
    if (os.platform() === "win32") {
      return nuget;
    }
    const
      folder = path.dirname(nuget),
      shim = path.join(folder, "nuget");
    await writeTextFile(
      shim, `#!/bin/sh
mono $(dirname $0)/nuget.exe $*
`);
    await chmod(shim, "777");
    return shim;
  }

  module.exports = findLocalNuget;
})();
