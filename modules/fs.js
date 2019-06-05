const
  promisify = require("./promisify-function"),
  path = require("path"),
  fs = require("fs");

const
  stat = promisify(fs.stat, fs),
  readFile = promisify(fs.readFile, fs),
  readdir = promisify(fs.readdir, fs),
  mkdir = promisify(fs.mkdir, fs),
  exists = promisify(fs.exists, fs, true);

const exported = {
  stat,
  readFile,
  readdir,
  mkdir,
  exists,

  ensureDirectoryExists: async function(expectedPath) {
    // forward-slashes can be valid (and mixed) on win32,
    //  so split on both \ and / to make \o/
    const
      parts = expectedPath.split(/\\|\//),
      current = [];
    for (const part of parts) {
      if (!part) {
        continue;
      }
      current.push(part);
      const
        test = current.join(path.sep),
        pathExists = await exists(test);
      if (pathExists) {
        const st = await stat(test);
        if (!st.isDirectory()) {
          throw new Error(`${test} exists but is not a directory`);
        }
        continue;
      }
      await mkdir(test);
    }
  }
};

Object.keys(fs)
  .filter(k => k.match(/Sync$/) && typeof fs[k] === "function")
  .forEach(k => exported[k] = fs[k].bind(fs));

module.exports = exported;
