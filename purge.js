const gulp = requireModule("gulp-with-help"),
  env = requireModule("env"),
  path = require("path"),
  rimraf = require("rimraf"),
  findDirs = requireModule("find-dirs"),
  log = requireModule("log"),
  debug = require("debug")("purge");

env.associate([
  "PURGE_DRY_RUN",
  "PURGE_JS_DIRS",
  "PURGE_DOTNET_DIRS",
  "PURGE_ADDITIONAL_DIRS"
], [
  "purge", "purge-dotnet", "mega-purge"
]);

function isNotInRootDir(dir) {
  // where 'root dir' refers to the gulp context current dir
  var inRootDir = path.resolve(path.basename(dir));
  return inRootDir !== dir;
}

function doRegularRm(dir, inRootToo) {
  const
    dryRun = env.resolveFlag("PURGE_DRY_RUN"),
    del = d => dryRun ? log.info(`del: ${d}`) : rimraf.sync(d);
  return new Promise((resolve, reject) => {
    try {
      debug(`searching for folders matching: ${dir}`);
      var matches = findDirs(".", dir, ["node_modules", "bower_components"]);
      debug(`got: ${matches}`);
      if (!inRootToo) {
        matches = matches.filter(isNotInRootDir);
      }
      if (matches.length === 0) {
        debug(`-> nothing to do for ${dir}`);
        return resolve();
      }
      matches.forEach(f => {
        debug(`should purge: ${f}`);
        del(f);
        debug(`purge complete: ${f}`);
      });
      resolve();
    } catch (e) {
      debug(`whoops! ${e}`);
      reject(e);
    }
  });
}


function doPurge(dirs, includeRootFolders) {
  return Promise.all(dirs.map(d => doRegularRm(d, includeRootFolders))).then(
    () => {
      debug("-- PURGE COMPLETE! ---");
    }
  );
}

function listPurgeDirs(...varNames) {
  return varNames.reduce(
    (acc, cur) => {
      const resolved = env.resolveArray(cur);
      acc.push.apply(acc, resolved);
      return acc;
    }, []);
}

const
  js = "PURGE_JS_DIRS",
  dotnet = "PURGE_DOTNET_DIRS",
  other = "PURGE_ADDITIONAL_DIRS";

gulp.task(
  "purge",
  "Purges all bins, objs, node_modules, bower_components and packages not in the root",
  function() {
    return doPurge(listPurgeDirs(dotnet, js, other), false);
  }
);

gulp.task("purge-dotnet", "Purges dotnet artifacts", () => {
  return doPurge(listPurgeDirs(dotnet, other), false);
});

gulp.task(
  "mega-purge",
  "Performs regular purge and in the root (you'll have to `npm install` afterwards!",
  function() {
    return doPurge(listPurgeDirs(dotnet, js, other), true);
  }
);
