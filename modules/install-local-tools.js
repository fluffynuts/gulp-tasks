"use strict";
(function () {
    const resolveNuget = require("./resolve-nuget"), downloadNuget = require("./download-nuget"), nugetUpdateSelf = require("./nuget-update-self"), debug = require("debug")("install-local-tools"), gutil = requireModule("gulp-util"), path = require("path"), { ls, FsEntities } = require("yafs"), getToolsFolder = require("./get-tools-folder"), nuget = require("./nuget"), ensureFolderExists = require("./ensure-folder-exists"), ZarroError = requireModule("zarro-error"), env = requireModule("env"), del = require("del"), vars = {
        SKIP_NUGET_UPDATES: "SKIP_NUGET_UPDATES",
        NUGET_SOURCES: "NUGET_SOURCES"
    };
    async function cleanFoldersFrom(toolsFolder) {
        const dirs = await ls(toolsFolder, { entities: FsEntities.folders });
        if (dirs.length) {
            debug(`Will delete the following tools sub-folders:`);
            dirs.forEach((d) => {
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
        const parts = toolSpec.split("/");
        const toolPackage = parts.splice(parts.length - 1);
        return ["install", toolPackage].concat(generateNugetSourcesOptions(parts[0]));
    }
    // gulp4 doesn't seem to protect against repeated dependencies, so this is a safeguard
    //  here to prevent accidental parallel installation
    //   let
    //     installingPromise: Optional<Promise<void>>,
    //     installingRequest: Optional<string[]>;
    const inProgress = {};
    const keyDelimiter = "||";
    function makeKey(parts) {
        return (parts || [])
            .join(keyDelimiter);
    }
    function splitKey(value) {
        return (value || "")
            .split(keyDelimiter)
            .sort();
    }
    module.exports = {
        install: (required, overrideToolsFolder) => {
            if (!required) {
                throw new ZarroError("No required tools set");
            }
            const requiredTools = Array.isArray(required)
                ? required
                : [required].sort();
            const target = overrideToolsFolder || getToolsFolder();
            // TODO: should allow subsequent installations, ie if
            //       a prior install asked for tools "A" and "B", a subsequent
            //       request for "C" should just wait and then do the work
            const key = makeKey(requiredTools);
            let installingPromise = inProgress[key];
            if (installingPromise) {
                debug(`tools installer already running for (${key}})...`);
                return installingPromise;
            }
            const inProgressTools = Object.keys(inProgress)
                .map(k => new Set(splitKey(k)));
            const stillRequired = [];
            for (let tool of requiredTools) {
                if (!tool) {
                    continue;
                }
                let shouldAdd = false;
                for (let group of inProgressTools) {
                    if (group.has(tool.toLowerCase())) {
                        shouldAdd = true;
                        break;
                    }
                }
                if (shouldAdd) {
                    stillRequired.push(tool);
                }
            }
            const inProgressKey = makeKey(stillRequired);
            return inProgress[inProgressKey] = ensureFolderExists(target)
                .then(async () => await cleanFoldersFrom(target))
                .then(() => downloadOrUpdateNuget(target))
                .then(() => Promise.all((requiredTools || []).map(tool => {
                debug(`install: ${tool}`);
                return nuget(generateNugetInstallArgsFor(tool), { cwd: target });
            })))
                .then(() => {
                debug("tool installation complete");
            });
        },
        clean: (overrideToolsFolder) => {
            debug("cleaning tools folder");
            const target = overrideToolsFolder || getToolsFolder();
            return cleanFoldersFrom(target);
        }
    };
})();
