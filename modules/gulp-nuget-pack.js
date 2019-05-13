const // remember new deps:
  temp = require("temp"),
  xml2js = require("xml2js"),
  // end new deps
  Vinyl = require("vinyl"),
  fs = require("fs"),
  path = require("path"),
  parseXml = function(data) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(data, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  },
  findLocalNuget = requireModule("find-local-nuget"),
  spawn = requireModule("spawn"),
  es = require("event-stream");

module.exports = function() {
  const tracked = temp.track();
  (workDir = tracked.mkdirSync()), (promises = []);
  return es.through(
    function write(file) {
      promises.push(
        new Promise(async (resolve, reject) => {
          const nuget = await findLocalNuget(),
            contents = file.contents.toString(),
            pkg = await parseXml(contents),
            metadata = pkg.package.metadata[0],
            packageName = metadata.id[0],
            version = metadata.version[0],
            expectedFileName = path.join(
              workDir,
              `${packageName}.${version}.nupkg`
            );

          await spawn(nuget, ["pack", file.path, "-OutputDirectory", workDir], {
            stdout: () => { /* suppress stdout: it's confusing anyway because it mentions temp files */ }
          });
          if (!fs.existsSync(expectedFileName)) {
            const err = `file not found: ${expectedFileName}`;
            this.emit("error", err);
            reject(err);
          } else {
            this.emit(
              "data",
              new Vinyl({
                path: path.basename(expectedFileName),
                contents: fs.readFileSync(expectedFileName)
              })
            );
            resolve();
          }
        })
      );
    },
    async function end() {
      await Promise.all(promises);
      tracked.cleanupSync();
      this.emit("end");
    }
  );
};
