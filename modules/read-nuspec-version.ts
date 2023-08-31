(function() {
    const
        parseXml = requireModule<ParseXml>("parse-xml"),
        ZarroError = requireModule<ZarroError>("zarro-error"),
        { readTextFile } = require("yafs");

    module.exports = async function readNuspecVersion(pathToNuspec: string) {
        const
            contents = await readTextFile(pathToNuspec),
            doc = await parseXml(contents);

        try {
            return doc.package.metadata[0].version[0];
        } catch (e) {
            throw new ZarroError(
                `Unable to read xml node package/metadata/version in file ${ pathToNuspec }`
            );
        }
    }
})();

export {};
