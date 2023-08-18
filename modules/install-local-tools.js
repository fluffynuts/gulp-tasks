const
  resolveNuget = require("./resolve-nuget"),
  downloadNuget = require("./download-nuget"),
  nugetUpdateSelf = require("./nuget-update-self"),
  debug = require("debug")("install-local-tools"),
  gutil = requireModule("gulp-util"),
  path = require("path"),
  fs = require("fs"),
  getToolsFolder = require("./get-tools-folder"),
  nuget = require("./nuget"),
  ensureFolderExists = require("./ensure-folder-exists"),
  ZarroError = requireModule("zarro-error"),
  env = requireModule("env"),
  del = require("del"),
  vars = {
    SKIP_NUGET_UPDATES: "SKIP_NUGET_UPDATES",
    NUGET_SOURCES: "NUGET_SOURCES"
  };


function cleanFoldersFrom(toolsFolder) {
  const dirs = fs
    .readdirSync(toolsFolder)
    .map(p => path.join(toolsFolder, p))
    .filter(p => {
      const stat = fs.lstatSync(p);
      return stat.isDirectory();
    });
  if (dirs.length) {
    debug(`Will delete the following tools sub-folders:`);
    dirs.forEach(d => {
      debug(` - ${d}`);
    });
  }
  return del(dirs);
}

function downloadOrUpdateNuget(targetFolder) {
  const nugetPath = path.join(targetFolder, "nuget.exe");
  const nuget = resolveNuget(nugetPath, false);
  if (nuget && !nuget.match(/dotnet/i)) {
    if (!env.resolveFlag(vars.SKIP_NUGET_UPDATES)) {
      gutil.log("nuget.exe already exists... attempting self-update");
      debug(`using nuget at: (${nuget})`);
      return nugetUpdateSelf(nuget);
    }
    return nuget;
  }
  debug(`Attempting to get tools nuget to: ${targetFolder}`);
  return downloadNuget(targetFolder);
}

function generateNugetSourcesOptions(toolSpecifiedSource) {
  if (toolSpecifiedSource) {
    return ["-source", toolSpecifiedSource];
  }
  return (env.resolve(vars.NUGET_SOURCES) || "")
    .split(",")
    .reduce((acc, cur) => acc.concat(cur ? ["-source", cur] : []), []);
}

function generateNugetInstallArgsFor(toolSpec) {
  // accept a tool package in the formats:
  // packagename (eg 'nunit')
  //  - retrieves the package according to the system config (original & default behavior)
  // source/packagename (eg 'proget.mycompany.moo/nunit')
  //  - retrieves the package from the named source (same as nuget.exe install nunit -source proget.mycompany.moo}
  //  - allows consumer to be specific about where the package should come from
  //  - allows third-parties to be specific about their packages being from, eg, nuget.org
  var parts = toolSpec.split("/");
  var toolPackage = parts.splice(parts.length - 1);
  return ["install", toolPackage].concat(generateNugetSourcesOptions(parts[0]));
}

// gulp4 doesn't seem to protect against repeated dependencies, so this is a safeguard
//  here to prevent accidental parallel install
let
  installingPromise = null,
  installingRequest = null;
module.exports = {
  install: (requiredTools, overrideToolsFolder) => {
    if (!requiredTools) {
      throw new ZarroError("No required tools set");
    }
    if (!Array.isArray(requiredTools)) {
      requiredTools = [requiredTools];
    }
    const target = overrideToolsFolder || getToolsFolder();
    // TODO: should allow subsequent installations, ie if
    //       a prior install asked for tools "A" and "B", a subsequent
    //       request for "C" should just wait and then do the work
    if (installingPromise) {
      debug("default tools installer already running...");
      const missing = requiredTools.reduce((acc, cur) => {
        if (installingRequest.indexOf(cur) === -1) {
          acc.push(cur);
        }
        return acc;
      }, []);
      if (missing.length) {
        return Promise.reject("multiple tools installations are not (yet) supported");
      }
      return installingPromise;
    }
    installingRequest = requiredTools;
    return installingPromise = ensureFolderExists(target)
      .then(() => cleanFoldersFrom(target))
      .then(() => downloadOrUpdateNuget(target))
      .then(() =>
        Promise.all(
          requiredTools.map(tool => {
            debug(`install: ${tool}`);
            return nuget(
              generateNugetInstallArgsFor(tool),
              { cwd: target }
            );
          })
        )
      )
      .then(() => {
        debug("tool installation complete");
      });
  },
  clean: overrideToolsFolder => {
    debug("cleaning tools folder");
    const target = overrideToolsFolder || getToolsFolder();
    return cleanFoldersFrom(target);
  }
};
