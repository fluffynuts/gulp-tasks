(function () {
  const pad = requireModule<Pad>("pad");
  module.exports = function padLeft(
      str: string,
      length: number,
      padString?: string
  ) {
    return pad(str, length, false, padString);
  };
})();
