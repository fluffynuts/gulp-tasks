const temp = require("temp"),
  xml2js = require("xml2js"),
  Vinyl = require("vinyl"),
  fs = require("./fs"),
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
  looksLikeAPromise = requireModule("looks-like-a-promise"),
  gutil = require("gulp-util"),
  spawnNuget = requireModule("spawn-nuget"),
  es = require("event-stream");

async function grokNuspec(xmlString) {
  const pkg = await parseXml(xmlString),
    metadata = pkg.package.metadata[0];
  return {
    packageName: metadata.id[0],
    packageVersion: metadata.version[0]
  };
}

async function resolveAll(obj) {
  const result = {};
  for (const key of Object.keys(obj)) {
    if (looksLikeAPromise(obj[key])) {
      result[key] = await obj[key];
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

function resolveRelativeBasePathOn(options, nuspecPath) {
  if (!options.basePath) {
    return;
  }
  if (options.basePath.indexOf("~") === 0) {
    const
      packageDir = path.dirname(nuspecPath).replace(/\\/g, "/"),
      sliced = options.basePath.substr(1).replace(/\\/g, "/");
    options.basePath = path.join(packageDir, sliced);
  }
}

function addOptionalParameters(options, args) {
  if (options.basePath) {
    gutil.log(`packaging with base path: ${options.basePath}`);
    args.splice(args.length, 0, "-BasePath", options.basePath);
  }
  if (options.excludeEmptyDirectories) {
    args.splice(args.length, 0, "-ExcludeEmptyDirectories");
  }
  if (options.version) {
    gutil.log(`Overriding package version with: ${options.version}`);
    args.splice(args.length, 0, "-version", options.version);
  }
}

function gulpNugetPack(options) {
  options = Object.assign({}, options);
  options.basePath = process.env.PACK_BASE_PATH || options.basePath;
  options.excludeEmptyDirectories = process.env.PACK_INCLUDE_EMPTY_DIRECTORIES
    ? false
    : options.excludeEmptyDirectories === undefined
    ? true
    : false;
  options.version = options.version || process.env.PACK_VERSION;

  const tracked = temp.track();
  (workDir = tracked.mkdirSync()), (promises = []);
  return es.through(
    function write(file) {
      promises.push(
        new Promise(async (resolve, reject) => {
          options = await resolveAll(options);
          resolveRelativeBasePathOn(options, file.path);
          const { packageName, packageVersion } = await grokNuspec(
              file.contents.toString()
            ),
            version = options.version || packageVersion,
            expectedFileName = path.join(
              workDir,
              `${packageName}.${version}.nupkg`
            ),
            args = ["pack", file.path, "-OutputDirectory", workDir];

          await fs.ensureDirectoryExists(workDir);
          addOptionalParameters(options, args);

          await spawnNuget(args, {
            stdout: () => {
              /* suppress stdout: it's confusing anyway because it mentions temp files */
            }
          });

          const outputExists = await fs.exists(expectedFileName);
          if (!outputExists) {
            const err = `file not found: ${expectedFileName}`;
            this.emit("error", err);
            reject(err);
          } else {
            logBuilt(expectedFileName);
            this.emit(
              "data",
              new Vinyl({
                path: path.basename(expectedFileName),
                contents: await fs.readFile(expectedFileName)
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
}

function logBuilt(packagePath) {
  gutil.log(
    gutil.colors.yellow(`build package: ${path.basename(packagePath)}`)
  );
}

module.exports = gulpNugetPack;
