"use strict";
(function () {
    class Version {
        get version() {
            return [...this._version];
        }
        constructor(ver) {
            this._version = Array.isArray(ver)
                ? ver
                : ver.split(".").map(s => parseInt(s, 10)).filter(n => !isNaN(n));
        }
        equals(other) {
            return this.compareWith(other) === 0;
        }
        isLessThan(other) {
            return this.compareWith(other) === -1;
        }
        isGreaterThan(other) {
            return this.compareWith(other) === 1;
        }
        compareWith(other) {
            const ver = other instanceof Version
                ? other
                : new Version(other);
            return compareVersionArrays(this.version, ver.version);
        }
        toString() {
            return this.version.join(".");
        }
    }
    function compareVersionArrays(x, y) {
        const shortest = Math.min(x.length, y.length), compare = [];
        for (let i = 0; i < shortest; i++) {
            if (x[i] > y[i]) {
                compare[i] = ">";
            }
            else if (x[i] < y[i]) {
                compare[i] = "<";
            }
            else {
                compare[i] = "0";
            }
        }
        if (compare.length === 0) {
            return 0;
        }
        const allZero = compare.reduce((acc, cur) => acc && (cur === "0"), true);
        if (allZero) {
            return 0;
        }
        for (const s of compare) {
            if (s === ">") {
                return 1;
            }
            else if (s === "<") {
                return -1;
            }
        }
        return 0;
    }
    module.exports = Version;
})();
