(function () {
  const
    env = requireModule<Env>("env"),
    actual = require("ansi-colors"),
    shim = {} as any,
    functions = Object.keys(actual)
      .filter(k => typeof actual[k] === "function");
  for (const fn of functions) {
    shim[fn] = (s: string) => {
      if (env.resolveFlag("NO_COLOR")) {
        return s;
      }
      return actual[fn](s);
    };
  }
  module.exports = shim;
})();
