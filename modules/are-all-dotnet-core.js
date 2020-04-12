const
  gulp = requireModule("gulp-with-help"),
  fs = require("fs"),
  xml2js = require("xml2js"),
  throwIfNoFiles = requireModule("throw-if-no-files"),
  path = require("path"),
  env = require("./env"),
  debug = require("debug")(path.basename(__filename.replace(/\.js$/, ""))),
  es = require("event-stream");

module.exports = async function areAllDotnetCore(
  gulpSrcSpecs
)
{
  if (process.env.DOTNETCORE !== undefined) {
    return env.resolveFlag("DOTNET_CORE");
  }
  return await new Promise(async (resolve, reject) => {
    const projFiles = [];
    gulp
      .src(gulpSrcSpecs, { allowEmpty: true })
      .pipe(throwIfNoFiles())
      .pipe(
        (() => {
          return es.through(
            function write(file) {
              if (!file) {
                return;
              }
              projFiles.push(file.path);
            },
            async function end() {
              if (projFiles.length === 0) {
                return resolve(false);
              }
              for (const proj of projFiles) {
                const isCoreOrStandard = await allTargetsAreCoreOrFramework(
                  proj
                );
                if (!isCoreOrStandard) {
                  resolve(false);
                }
              }
              resolve(true);
            }
          );
        })()
      );
  });
}

async function allTargetsAreCoreOrFramework(csproj) {
  return new Promise(async (resolve, reject) => {
    try {
      debug(`testing for netcore/netstandard: ${csproj}`);
      const contents = fs.readFileSync(csproj, { encoding: "utf-8" }),
        parser = new xml2js.Parser();
      parser.parseString(contents, (err, data) => {
        if (err) {
          return reject(err);
        }
        if (!data.Project) {
          resolve(false);
        }
        let foundTargetFrameworksNode = false;
        const allCoreOrStandard = (data.Project.PropertyGroup || []).reduce(
          (acc, cur) => {
            const targetFrameworksNode =
              cur.TargetFramework || cur.TargetFrameworks;
            if (!targetFrameworksNode) {
              return acc;
            }
            foundTargetFrameworksNode = true;
            const targetFrameworks = targetFrameworksNode.join("").split(";");
            debug(`have target framework(s): ${targetFrameworks}`);
            return (
              acc &&
              targetFrameworks.reduce((acc2, cur2) => {
                return (
                  acc2 &&
                  (cur2.indexOf("netstandard") === 0 ||
                    cur2.indexOf("netcoreapp") === 0)
                );
              }, true)
            );
          },
          true
        ) && foundTargetFrameworksNode;
        debug(`all targets are core/standard: ${allCoreOrStandard}`);
        resolve(allCoreOrStandard);
      });
    } catch (e) {
      reject(e);
    }
  });
}
