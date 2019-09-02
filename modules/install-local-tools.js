const
  resolveNuget = require("./resolve-nuget"),
  downloadNuget = require("./download-nuget"),
  nugetUpdateSelf = require("./nuget-update-self"),
  debug = require("debug")("install-local-tools"),
  gutil = require("gulp-util"),
  path = require("path"),
  fs = require("fs"),
  getToolsFolder = require("./get-tools-folder"),
  nuget = require("./nuget"),
  ensureFolderExists = require("./ensure-folder-exists"),
  del = require("del");

function cleanFoldersFrom(toolsFolder) {
  const dirs = fs.readdirSync(toolsFolder)
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
  if (nuget) {
    if (!process.env.SKIP_NUGET_UPDATES) {
      gutil.log("nuget.exe already exists... attempting self-update");
      console.log(`NUGET: (${nuget})`);
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
  return (process.env.NUGET_SOURCES || "").split(',').reduce(
    (acc, cur) => acc.concat(cur ? ["-source", cur] : []), []
  );
}


function generateNugetInstallArgsFor(toolSpec) {
  // accept a tool package in the formats:
  // packagename (eg 'nunit')
  //  - retrieves the package according to the system config (original & default behavior)
  // source/packagename (eg 'proget.mycompany.moo/nunit')
  //  - retrieves the package from the named source (same as nuget.exe install nunit -source proget.mycompany.moo}
  //  - allows consumer to be specific about where the package should come from
  //  - allows third-parties to be specific about their packages being from, eg, nuget.org
  var parts = toolSpec.split('/');
  var toolPackage = parts.splice(parts.length - 1);
  return ["install", toolPackage].concat(generateNugetSourcesOptions(parts[0]));
}

// gulp4 doesn't seem to protect against repeated dependencies, so this is a safeguard
//  here to prevent accidental parallel install
var installing = false;
module.exports = {
  install: (requiredTools, overrideToolsFolder) => {
    if (!requiredTools) {
      throw new Error("No required tools set");
    }
    if (installing) {
      debug("default tools installer already running...");
      return Promise.resolve();
    }
    installing = true;
    if (!Array.isArray(requiredTools)) {
      requiredTools = [requiredTools];
    }
    const target = overrideToolsFolder || getToolsFolder();
    return ensureFolderExists(target)
      .then(() => cleanFoldersFrom(target))
      .then(() => downloadOrUpdateNuget(target))
      .then(() => Promise.all(
        requiredTools.map(tool =>
          nuget(
            generateNugetInstallArgsFor(tool),
            { cwd: target }
          )
        )
      )).then(() => {
        installing = false;
      });
  },
  clean: (overrideToolsFolder) => {
    const target = overrideToolsFolder || getToolsFolder();
    return cleanFoldersFrom(target);
  }
}
