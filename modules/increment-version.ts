(function() {
  const ZarroError = requireModule<ZarroError>("zarro-error");
  const { currentShortSHA } = requireModule<GitSha>("git-sha");

  function zeroFrom(parts: number[], startIndex: number) {
    for (let i = startIndex; i < parts.length; i++) {
      parts[i] = 0;
    }
  }

  function incrementAt(
    parts: number[],
    index: number,
    incrementBy: number
  ) {
    if (parts[index] === undefined) {
      throw new ZarroError(`version '${ parts.join(".") }' has no value at position ${ index }`);
    }
    parts[index] += incrementBy;
  }

  const incrementLookup: { [key: string]: number } = {
    "prerelease": -1,
    "major": 0,
    "minor": 1,
    "patch": 2
  };

  module.exports = function incrementVersion(
    version: string,
    strategy: VersionIncrementStrategy,
    zeroLowerOrder: boolean = true,
    incrementBy: number = 1
  ): string {
    const
      dashedParts = version.split("-"),
      parts = dashedParts[0].split(".").map(i => parseInt(i));
    let toIncrement = incrementLookup[(strategy || "").toLowerCase()]
    if (toIncrement === undefined) {
      throw new ZarroError(`Unknown version increment strategy: ${ strategy }\n try one of 'major', 'minor' or 'patch'`);
    }
    if (strategy != "prerelease") {
      const shouldNotActuallyIncrement = strategy === "patch" &&
        dashedParts.length > 1;
      if (!shouldNotActuallyIncrement) {
        incrementAt(parts, toIncrement, incrementBy);
      }
      if (zeroLowerOrder) {
        zeroFrom(parts, toIncrement + 1);
      }
    } else {
      // bump the minor if this is the first pre-release
      if (dashedParts.length === 1) {
        incrementAt(parts, 2, 1);
      }
    }
    const result = parts.join(".");
    if (strategy != "prerelease") {
      return result;
    }
    const sha = currentShortSHA();
    return `${ result }-${ timestamp() }.${ sha }`;
  }



  function timestamp(): string {
    const
      now = new Date(Date.now()),
      year = `${ now.getFullYear() }`.substring(2),
      month = zeroPad(now.getMonth() + 1),
      day = zeroPad(now.getDate()),
      hour = zeroPad(now.getHours()),
      minute = zeroPad(now.getMinutes());
    return [
      year,
      month,
      day,
      hour,
      minute
    ].join("");
  }

  function zeroPad(i: number): string {
    return i < 10 ? `0${ i }` : `${ i }`;
  }

})()
