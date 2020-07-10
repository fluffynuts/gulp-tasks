(function() {
  const
    xml2js = require("xml2js"),
    promisify = requireModule<PromisifyFunction>("promisify-function");
  module.exports = promisify(xml2js.parseString, xml2js);
})();
