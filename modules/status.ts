(function () {
  "use strict";
  const
    env = requireModule<Env>("env"),
    chalk = requireModule<AnsiColors>("ansi-colors"),
    noUnicode = env.resolveFlag("NO_UNICODE"),
    noColor = env.resolveFlag("NO_COLOR"),
    prefixSize = noUnicode ? 6 : 2,
    asciiOk = "[ OK ]",
    asciiFail = "[FAIL]",
    okMarker = noUnicode
      ? (noColor ? asciiOk : chalk.green(asciiOk))
      : chalk.greenBright("✓"),
    failMarker = noUnicode
      ? (noColor ? asciiFail : chalk.redBright(asciiFail))
      : chalk.redBright("❌"),
    spacedPrefix = " ".repeat(prefixSize);

  function start(message: string, color?: Colors) {
    if (color && chalk[color as keyof AnsiColors]) {
      message = chalk[color](message);
    }
    process.stdout.write(`${spacedPrefix} ${message}`);
  }

  function ok() {
    process.stdout.write(`\r${okMarker}`);
    process.stdout.write("\n");
  }

  function fail() {
    process.stdout.write(`\r${failMarker}`);
    process.stdout.write("\n");
  }

  function looksLikePromise(o: any) {
    return isFunction(o.then);
  }

  function isFunction(o: any) {
    return typeof (o) === "function";
  }

  async function run<T>(message: string, action: (() => T | Promise<T>)) {
    start(message);
    let result;
    try {
      result = action();
    } catch (e) {
      fail();
      throw e;
    }
    if (looksLikePromise(result)) {
      try {
        result = await result;
      } catch (e) {
        fail();
        throw e;
      }
    }
    ok()
    return result;
  }

  module.exports = {
    start,
    ok,
    fail,
    run
  };
})();
