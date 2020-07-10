(function () {
  const
    fs = require("./fs"),
    parse = requireModule<ParseXmlString>("./parse-xml-string");

  module.exports = async function (filePath: string) {
    const st = await fs.stat(filePath);
    if (!st.isFile()) {
      throw new Error(`File not found: ${filePath}`);
    }
    const data = await fs.readFile(filePath, { encoding: "utf-8" });
    return parse(data);
  }
})();
