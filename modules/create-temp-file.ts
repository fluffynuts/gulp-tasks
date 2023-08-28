(function() {
  const {
      rm,
      folderExists,
      rmSync,
      writeFile
    } = require("yafs"),
    os = require("os"),
    isWindows = os.platform() === "win32",
    path = require("path");

  const toCleanAtExit = [] as string[];

  class TempFileImpl implements TempFile {
    constructor(
      public path: string
    ) {
      toCleanAtExit.push(this.path);
    }

    destroy() {
      rmSync(this.path);
    }
  }

  async function findTempDir(): Promise<string> {
    return isWindows
      ? findTempDirWin32()
      : findTempDirUnix();
  }

  async function findTempDirUnix(): Promise<string> {
    for (const v of [ "TEMP", "TMP" ]) {
      const tempPath = process.env[v];
      if (tempPath && await folderExists(tempPath)) {
        return tempPath;
      }
    }
    if (await folderExists("/tmp")) {
      return "/tmp";
    }
    throw new Error(`Can't find temp dir; if you really don't want a /tmp folder, please define the TEMP env var to the path of a folder to use for temp files`);
  }

  async function findTempDirWin32(): Promise<string> {
    for (const v of [ "TEMP", "TMP" ]) {
      const tempPath = process.env[v];
      if (tempPath && await folderExists(tempPath)) {
        return tempPath;
      }
    }
    throw new Error(`Can't find temp dir`);
  }

  async function findFirstFolderFromEnvVar(
    ...vars: string[]
  ) {
    for (const v of vars) {
    }
  }

  const charset = [] as string[];
  const ranges = [
    [ "A".charCodeAt(0), "Z".charCodeAt(0) ],
    [ "a".charCodeAt(0), "z".charCodeAt(0) ],
    [ "0".charCodeAt(0), "9".charCodeAt(0) ]
  ];
  for (let range of ranges) {
    for (let i = range[0]; i <= range[1]; i++) {
      charset.push(String.fromCharCode(i));
    }
  }

  function randomAlphaNumericChar(): string {
    const idx = Math.round(
      Math.random() * charset.length
    );
    return charset[idx];
  }

  async function generateTempFilePath(): Promise<string> {
    const
      tempDir = await findTempDir(),
      fname = [],
      ext = isWindows ? ".bat" : ".tmp";
    for (let i = 0; i < 10; i++) {
      fname.push(randomAlphaNumericChar());
    }
    return path.join(tempDir, `${ fname.join("") }${ ext }`);
  }

  process.on("exit", async () => {
    const promises = toCleanAtExit.map(
      async p => {
        try {
          await rm(p)
        } catch (e) {
          // suppress: don't fail exit due to locked file
        }
      }
    );
    await Promise.all(promises);
  });

  module.exports = async function createTempFile(
    contents: string | Buffer,
    at?: string
  ): Promise<TempFile> {
    const target = at ?? await generateTempFilePath();
    await writeFile(
      target,
      contents ?? ""
    );
    return new TempFileImpl(target);
  }
})();
