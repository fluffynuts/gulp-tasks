const
  downloadNuget = require("./download-nuget"),
  debug = require("debug")("install-local-tools"),
  gutil = require("gulp-util"),
  exec = requireModule("exec"),
  path = require("path"),
  fs = require("fs"),
  getToolsFolder = require("./get-tools-folder"),
  nugetExe = "nuget.exe",
  del = require("del");

function ensureFolderExists(toolsFolder) {
  debug(`Ensuring existence of tools folder "${toolsFolder}"`);
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(toolsFolder)) {
        fs.mkdirSync(toolsFolder);
      }
      debug(`${toolsFolder} exists!`);
      resolve();
    } catch (e) {
      debug(`${toolsFolder} doesn't exist and not creatable`);
      debug(e);
      reject(e);
    }
  });
}

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
  debug(`Attempting to get tools nuget to: ${targetFolder}`);
  if (fs.existsSync(nugetPath)) {
    gutil.log("nuget.exe already exists... attempting self-update");
    return exec(nugetPath, [
      "update", "-self"
    ]);
  } else {
    return downloadNuget(targetFolder);
  }
}

function generateNugetSourcesOptions(toolSpecifiedSource) {
  if (toolSpecifiedSource) {
    return ["-source", toolSpecifiedSource];
  }
  return (process.env.NUGET_SOURCES || "").split(',').reduce(
    (acc, cur) => acc.concat(["-source", cur]), []
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

module.exports = {
  install: (requiredTools, overrideToolsFolder) => {
    if (!requiredTools) {
      throw new Error("No required tools set");
    }
    if (!Array.isArray(requiredTools)) {
      requiredTools = [requiredTools];
    }
    const target = overrideToolsFolder || getToolsFolder();
    return ensureFolderExists(target)
      .then(() => cleanFoldersFrom(target))
      .then(() => downloadOrUpdateNuget(target))
      .then(() => Promise.all(
        requiredTools.map(tool => exec(
            nugetExe,
            generateNugetInstallArgsFor(tool),
            { cwd: target }
          )
        )));
  },
  clean: (overrideToolsFolder) => {
    const target = overrideToolsFolder || getToolsFolder();
    return cleanFoldersFrom(target);
  }
}
