"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const version_reading_shared_1 = require("./version-reading-shared");
(function () {
    const parseXml = requireModule("parse-xml"), readTextFile = requireModule("read-text-file");
    module.exports = async function readProjectVersion(pathToCsProj) {
        const contents = await readTextFile(pathToCsProj), doc = await parseXml(contents);
        try {
            const propertyGroups = doc.Project.PropertyGroup;
            return version_reading_shared_1.tryReadVersionFrom(propertyGroups, "Version");
        }
        catch (e) {
            throw new Error(`Unable to read any xml node Project/PropertyGroup/PackageVersion in file ${pathToCsProj}`);
        }
    };
})();
