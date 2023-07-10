"use strict";
(function () {
    const parseXml = requireModule("parse-xml"), fallbackAssemblyVersion = "1.0.0", path = require("path"), readTextFile = requireModule("read-text-file");
    async function readProjectVersion(pathToCsProj) {
        return readCsProjProperty(pathToCsProj, "Version", fallbackAssemblyVersion);
    }
    async function readPackageVersion(pathToCsProj) {
        return readCsProjProperty(pathToCsProj, "PackageVersion", fallbackAssemblyVersion);
    }
    async function readAssemblyVersion(pathToCsProj) {
        return readCsProjProperty(pathToCsProj, "AssemblyVersion", fallbackAssemblyVersion);
    }
    function determineAssemblyNameFromProjectPath(pathToCsProj) {
        const basename = path.basename(pathToCsProj);
        return basename.replace(/\.csproj$/i, "");
    }
    async function readAssemblyName(pathToCsProj) {
        return await readCsProjProperty(pathToCsProj, "AssemblyName", async () => determineAssemblyNameFromProjectPath(pathToCsProj));
    }
    function readTextFrom(node) {
        return node
            ? node[0]
            : undefined;
    }
    function tryReadNodeFrom(groups, nodeName) {
        return groups.reduce((acc, cur) => acc || readTextFrom(cur[nodeName]), undefined);
    }
    async function readCsProjProperty(pathToCsProj, property, fallback) {
        const contents = await readTextFile(pathToCsProj), doc = await parseXml(contents);
        try {
            const propertyGroups = doc.Project.PropertyGroup;
            const result = tryReadNodeFrom(propertyGroups, property);
            if (!!result) {
                return result;
            }
            return await resolveFallback(fallback);
        }
        catch (e) {
            return await resolveFallback();
        }
    }
    async function resolveFallback(fallback) {
        if (fallback === undefined) {
            return undefined;
        }
        if (typeof fallback === "string") {
            return fallback;
        }
        return await fallback();
    }
    module.exports = {
        readProjectVersion,
        readAssemblyVersion,
        readPackageVersion,
        readAssemblyName,
        readCsProjProperty
    };
})();
