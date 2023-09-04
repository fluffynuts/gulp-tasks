"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const parseXml = requireModule("parse-xml"), ZarroError = requireModule("zarro-error"), { Builder } = require("xml2js"), { fileExists, readTextFile, writeTextFile } = require("yafs");
    async function updateNuspecVersion(fileOrXml, newVersion) {
        const contents = await resolveContents(fileOrXml), isFile = contents !== fileOrXml, doc = await parseXml(contents);
        if (!doc || !doc.package || !doc.package.metadata) {
            const n = isFile
                ? " "
                : "\n";
            throw new Error(`does not appear to be a package.nuspec:${n}${fileOrXml}`);
        }
        const metadata = doc.package.metadata;
        if (!Array.isArray(metadata)) {
            throw new Error(`metadata is not an array ):`);
        }
        for (let m of metadata) {
            if (Array.isArray(m.version)) {
                m.version[0] = newVersion;
            }
        }
        const builder = new Builder(), xml = builder.buildObject(doc);
        if (isFile) {
            await writeTextFile(fileOrXml, xml);
        }
        return xml;
    }
    async function resolveContents(fileOrXml) {
        if (!fileOrXml) {
            throw new ZarroError(`fileOrXml not set`);
        }
        if (await fileExists(fileOrXml)) {
            return await readTextFile(fileOrXml);
        }
        if (fileOrXml.indexOf("<") === -1) {
            throw new ZarroError(`input is not an existing file, and doesn't seem to be xml either`);
        }
        return fileOrXml;
    }
    module.exports = updateNuspecVersion;
})();
