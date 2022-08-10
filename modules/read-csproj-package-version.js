"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const version_reading_shared_1 = require("./version-reading-shared");
(function () {
    const { ZarroError } = requireModule("zarro-error"), parseXml = requireModule("parse-xml"), readTextFile = requireModule("read-text-file");
    module.exports = async function readProjectVersion(pathToCsProj) {
        const contents = await readTextFile(pathToCsProj), doc = await parseXml(contents);
        try {
            const propertyGroups = doc.Project.PropertyGroup;
            return (0, version_reading_shared_1.tryReadVersionFrom)(propertyGroups, "PackageVersion");
        }
        catch (e) {
            throw new ZarroError(`Unable to read any xml node Project/PropertyGroup/PackageVersion in file ${pathToCsProj}`);
        }
    };
})();
