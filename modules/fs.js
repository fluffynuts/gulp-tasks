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

function isFile(p) {
  return runStat(p, st => st.isFile());
}

function isFolder(p) {
  return runStat(p, st => st.isDirectory());
}

function runStat(p, fn) {
  return new Promise(resolve => {
    fs.stat(p, (err, st) => {
      if (err) {
        return resolve(false);
      }
      try {
        resolve(st && fn(st));
      } catch (e) {
        resolve(false);
      }
    });
  });
}

const exported = {
  ...fs.promises,  // if they exist
  stat,
  readFile,
  readdir,
  mkdir,
  exists,
  isFile,
  isFolder,
  fileExists: isFile,
  folderExists: isFolder,

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
