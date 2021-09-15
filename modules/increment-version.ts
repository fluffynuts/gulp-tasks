const { ZarroError } = requireModule("zarro-error");

function zeroFrom(parts: number[], startIndex: number) {
  for (let i = startIndex; i < parts.length; i++) {
    parts[i] = 0;
  }
}

function incrementAt(
  parts: number[],
  index: number,
  incrementBy: number) {
  if (parts[index] === undefined) {
    throw new ZarroError(`version '${parts.join(".")}' has no value at position ${index}`);
  }
  parts[index] += incrementBy;
}

const incrementLookup: { [key: string]: number } = {
  "major": 0,
  "minor": 1,
  "patch": 2
};


module.exports = function incrementVersion(
  version: string,
  strategy: "major" | "minor" | "patch",
  zeroLowerOrder: boolean,
  incrementBy: number = 1): string {
  const parts = version.split(".").map(i => parseInt(i));
  let toIncrement = incrementLookup[(strategy || "").toLowerCase()]
  if (toIncrement === undefined) {
    throw new ZarroError(`Unknown version increment strategy: ${strategy}\n try one of 'major', 'minor' or 'patch'`);
  }
  incrementAt(parts, toIncrement, incrementBy);
  if (zeroLowerOrder) {
    zeroFrom(parts, toIncrement + 1);
  }
  return parts.join(".");
}
