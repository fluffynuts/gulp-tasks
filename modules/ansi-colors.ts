(function() {
  const ansiColors = require("ansi-colors") as any;
  for (const k of Object.keys(ansiColors)) {
    const original = ansiColors[k];
    if (typeof original !== "function") {
      Object.defineProperty(module.exports, k, {
        get(): any {
          return ansiColors[k] as any;
        },
        set(v: any) {
          ansiColors[k] = v;
        }
      });
      continue;
    }

    module.exports[k] = (s: string) => {
      return isSuppressed()
        ? s
        : ansiColors[k](s);
    };
  }

  function isSuppressed() {
    if (flag(process.env.FORCE_COLOR)) {
      return false;
    }
    return flag(
      process.env.NO_COLOR
    ) || !process.stdout.isTTY;
  }

  const truthy = new Set([ 1, true, "1" ]);

  function flag(value: any): boolean {
    return truthy.has(value);
  }
})();
