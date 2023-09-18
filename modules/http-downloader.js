(function() {
  console.warn("http-downloader is deprecated; this is now a shim to http-client");
  module.exports = requireModule("http-client");
})();
