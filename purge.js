"use strict";
(function () {
    const gulp = requireModule("gulp"), { rmSync, lsSync, FsEntities, folderExistsSync } = require("yafs"), multiSplit = requireModule("multi-split"), env = requireModule("env"), path = require("path"), log = requireModule("log"), debug = requireModule("debug")(__filename);
    env.associate([
        "DRY_RUN",
        "PURGE_JS_DIRS",
        "PURGE_DOTNET_DIRS",
        "PURGE_ADDITIONAL_DIRS"
    ], [
        "purge", "purge-dotnet", "mega-purge"
    ]);
    function isNotInRootDir(dir) {
        // where 'root dir' refers to the gulp context current dir
        const inRootDir = path.resolve(path.basename(dir));
        return inRootDir !== dir;
    }
    function doRegularRm(dir, inRootToo) {
        const dryRun = env.resolveFlag("DRY_RUN"), del = (d) => dryRun
            ? log.info(`del: ${d}`)
            : rmSync(d);
        return new Promise((resolve, reject) => {
            try {
                debug(`searching for folders matching: ${dir}`);
                let matches = findDirs(".", dir, ["node_modules", "bower_components"]);
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
            }
            catch (e) {
                debug(`whoops! ${e}`);
                reject(e);
            }
        });
    }
    const cache = {};
    function findDirs(under, withName, neverTraverse) {
        const result = [];
        neverTraverse = neverTraverse || [];
        const start = cache[under] ||
            (cache[under] = lsSync(under, { entities: FsEntities.folders }));
        const dirs = start
            .map(d => path.resolve(path.join(under, d)))
            .filter(folderExistsSync);
        const toAdd = dirs.filter(d => path.basename(d) === withName);
        const toCheck = dirs
            .filter(d => path.basename(d) !== withName)
            .filter(d => {
            const parts = multiSplit(d, ["/", "\\"]), include = neverTraverse.indexOf(parts[parts.length - 1]) === -1;
            return include;
        });
        result.push(...toAdd);
        toCheck.forEach(d => {
            result.push.apply(result, findDirs(d, withName, neverTraverse));
        });
        return result;
    }
    async function doPurge(dirs, includeRootFolders) {
        await Promise.all(dirs.map(d => doRegularRm(d, includeRootFolders)));
        debug("-- PURGE COMPLETE! ---");
    }
    function listPurgeDirs(...varNames) {
        return varNames.reduce((acc, cur) => {
            const resolved = env.resolveArray(cur);
            acc.push.apply(acc, resolved);
            return acc;
        }, []);
    }
    const js = "PURGE_JS_DIRS", dotnet = "PURGE_DOTNET_DIRS", other = "PURGE_ADDITIONAL_DIRS";
    gulp.task("purge", "Purges all bins, objs, node_modules, bower_components and packages not in the root", function () {
        return doPurge(listPurgeDirs(dotnet, js, other), false);
    });
    gulp.task("purge-dotnet", "Purges dotnet artifacts", () => {
        return doPurge(listPurgeDirs(dotnet, other), false);
    });
    gulp.task("mega-purge", "Performs regular purge and in the root (you'll have to `npm install` afterwards!", function () {
        return doPurge(listPurgeDirs(dotnet, js, other), true);
    });
})();
