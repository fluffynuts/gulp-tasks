"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const parseXml = requireModule("parse-xml"), readTextFile = requireModule("read-text-file");
    module.exports = async function readNuspecVersion(pathToNuspec) {
        const contents = await readTextFile(pathToNuspec), doc = await parseXml(contents);
        try {
            return doc.package.metadata[0].version[0];
        }
        catch (e) {
            throw new Error(`Unable to read xml node package/metadata/version in file ${pathToNuspec}`);
        }
    };
})();
