"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const parseXml = requireModule("parse-xml"), readTextFile = requireModule("read-text-file");
    function readTextFrom(node) {
        return node
            ? node[0]
            : undefined;
    }
    module.exports = async function readNuspecVersion(pathToCsProj) {
        const contents = await readTextFile(pathToCsProj), doc = await parseXml(contents);
        try {
            const propertyGroups = doc.Project.PropertyGroup;
            return propertyGroups.reduce((acc, cur) => acc || readTextFrom(cur.PackageVersion), undefined);
        }
        catch (e) {
            throw new Error(`Unable to read any xml node Project/PropertyGroup/PackageVersion in file ${pathToCsProj}`);
        }
    };
})();
