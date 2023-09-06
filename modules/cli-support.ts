(function() {
  const q = requireModule<QuoteIfRequired>("quote-if-required");

  function pushIfSet(
    args: string[],
    value: Optional<string | number>,
    cliSwitch: string
  ) {
    if (value) {
      args.push(cliSwitch, q(`${ value }`));
    }
  }

  function pushFlag(args: string[], value: Optional<boolean>, cliSwitch: string) {
    if (value) {
      args.push(cliSwitch);
    }
  }

  module.exports = {
    pushIfSet,
    pushFlag
  };
})();
