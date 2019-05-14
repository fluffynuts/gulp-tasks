const
  xml2js = require("xml2js"),
  promisify = require("./promisify-function");
module.exports = promisify(xml2js.parseString, xml2js);
