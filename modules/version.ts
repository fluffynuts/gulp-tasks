(function () {
  class Version {
    public get version(): number[] {
      return [...this._version];
    }

    public get major(): number {
      return this._version[0] || 0;
    }

    public get minor(): number {
      return this._version[1] || 0;
    }

    public get patch(): number {
      return this._version[2] || 0;
    }

    public get tag(): string {
      return this._tag;
    }

    public get isPreRelease(): boolean {
      return !!this._tag;
    }

    private readonly _version: number[];
    private readonly _tag: string;

    constructor(
      verOrMajor: string | number[] | number | VersionInfo,
      minor?: number,
      patch?: number,
      tag?: string
    ) {
      if (Array.isArray(verOrMajor)) {
        this._version = [...verOrMajor];
        this._tag = "";
      } else if (typeof verOrMajor === "object") {
        this._version = [
          verOrMajor.major || 0,
          verOrMajor.minor || 0,
          verOrMajor.patch || 0
        ];
        this._tag = verOrMajor.tag || "";
      } else if (typeof verOrMajor === "string") {
        const parts = verOrMajor.split("-");
        this._version = parts[0].split(".")
          .map(s => parseInt(s, 10))
          .filter(n => !isNaN(n));
        this._tag = parts[1] || "";
        return;
      } else {
        this._version = [verOrMajor, minor ?? 0, patch ?? 0];
        this._tag = tag ?? "";
      }
      this.ensureVersionIsThreeNumbers();
    }

    private ensureVersionIsThreeNumbers() {
      while (this._version.length < 3) {
        this._version.push(0);
      }
      const dropped = this._version.splice(3);
      if (dropped.length) {

      }
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
      const ver = this.version.join(".");
      return !!this._tag
        ? `${ver}-${this._tag}`
        : ver;
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
