"use strict";
(function () {
    const parseXml = requireModule("parse-xml"), fallbackAssemblyVersion = "1.0.0", path = require("path"), readTextFile = requireModule("read-text-file");
    async function readProjectVersion(pathToCsProj) {
        var _a;
        const contents = await readTextFile(pathToCsProj), doc = await parseXml(contents);
        try {
            const propertyGroups = doc.Project.PropertyGroup;
            return (_a = tryReadNodeFrom(propertyGroups, "Version")) !== null && _a !== void 0 ? _a : fallbackAssemblyVersion;
        }
        catch (e) {
            return fallbackAssemblyVersion;
        }
    }
    async function readPackageVersion(pathToCsProj) {
        var _a;
        const contents = await readTextFile(pathToCsProj), doc = await parseXml(contents);
        try {
            const propertyGroups = doc.Project.PropertyGroup;
            return (_a = tryReadNodeFrom(propertyGroups, "PackageVersion")) !== null && _a !== void 0 ? _a : fallbackAssemblyVersion;
        }
        catch (e) {
            return fallbackAssemblyVersion;
        }
    }
    async function readAssemblyVersion(pathToCsProj) {
        var _a;
        const contents = await readTextFile(pathToCsProj), doc = await parseXml(contents);
        try {
            const propertyGroups = doc.Project.PropertyGroup;
            return (_a = tryReadNodeFrom(propertyGroups, "AssemblyVersion")) !== null && _a !== void 0 ? _a : fallbackAssemblyVersion;
        }
        catch (e) {
            return fallbackAssemblyVersion;
        }
    }
    function determineAssemblyNameFromProjectPath(pathToCsProj) {
        const basename = path.basename(pathToCsProj);
        return basename.replace(/\.csproj$/i, "");
    }
    async function readAssemblyName(pathToCsProj) {
        var _a;
        const contents = await readTextFile(pathToCsProj), doc = await parseXml(contents);
        try {
            const propertyGroups = doc.Project.PropertyGroup;
            return (_a = tryReadNodeFrom(propertyGroups, "AssemblyName")) !== null && _a !== void 0 ? _a : determineAssemblyNameFromProjectPath(pathToCsProj);
        }
        catch (e) {
            return fallbackAssemblyVersion;
        }
    }
    function readTextFrom(node) {
        return node
            ? node[0]
            : undefined;
    }
    function tryReadNodeFrom(groups, nodeName) {
        return groups.reduce((acc, cur) => acc || readTextFrom(cur[nodeName]), undefined);
    }
    module.exports = {
        readProjectVersion,
        readAssemblyVersion,
        readPackageVersion,
        readAssemblyName
    };
})();
