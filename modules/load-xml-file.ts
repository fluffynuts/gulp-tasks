(function () {
  const
    { readTextFile, fileExists } = require("yafs"),
    ZarroError = requireModule<ZarroError>("zarro-error"),
    parse = requireModule<ParseXmlString>("./parse-xml-string");

  module.exports = async function (filePath: string): Promise<any> {
    if (!await fileExists(filePath)) {
      throw new ZarroError(`File not found: ${filePath}`);
    }
    const data = await readTextFile(filePath);
    return parse(data);
  }
})();
