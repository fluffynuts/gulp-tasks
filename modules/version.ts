(function () {
  class Version {
    public get version(): number[] {
      return [...this._version];
    }

    private readonly _version: number[];

    constructor(ver: string | number[]) {
      this._version = Array.isArray(ver)
        ? ver
        : ver.split(".").map(s => parseInt(s, 10)).filter(n => !isNaN(n));
    }

    public equals(other: Version | string) {
      return this.compareWith(other) === 0;
    }

    public isLessThan(other: Version | string | number[]) {
      return this.compareWith(other) === -1;
    }

    public isGreaterThan(other: Version | string | number[]) {
      return this.compareWith(other) === 1;
    }

    public compareWith(other: Version | string | number[]) {
      const ver = other instanceof Version
        ? other
        : new Version(other);
      return compareVersionArrays(
        this.version,
        ver.version
      );
    }

    public toString() {
      return this.version.join(".");
    }
  }

  function compareVersionArrays(
    x: number[],
    y: number[]
  ): number {
    const
      shortest = Math.min(x.length, y.length),
      compare = [] as string[];
    for (let i = 0; i < shortest; i++) {
      if (x[i] > y[i]) {
        compare[i] = ">";
      } else if (x[i] < y[i]) {
        compare[i] = "<";
      } else {
        compare[i] = "0";
      }
    }
    if (compare.length === 0) {
      return 0;
    }
    const allZero = compare.reduce(
      (acc: boolean, cur: string) => acc && (cur === "0"), true
    );
    if (allZero) {
      return 0;
    }
    for (const s of compare) {
      if (s === ">") {
        return 1
      } else if (s === "<") {
        return -1;
      }
    }
    return 0;
  }

  module.exports = Version;
})();
