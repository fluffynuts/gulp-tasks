(function () {
  const
    fs = require("./fs"),
    { ZarroError } = requireModule("zarro-error"),
    parse = requireModule<ParseXmlString>("./parse-xml-string");

  module.exports = async function (filePath: string): Promise<any> {
    const st = await fs.stat(filePath);
    if (!st.isFile()) {
      throw new ZarroError(`File not found: ${filePath}`);
    }
    const data = await fs.readFile(filePath, { encoding: "utf-8" });
    return parse(data);
  }
})();
