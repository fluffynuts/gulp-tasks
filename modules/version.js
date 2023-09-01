"use strict";
(function () {
    class Version {
        get version() {
            return [...this._version];
        }
        get major() {
            return this._version[0] || 0;
        }
        get minor() {
            return this._version[1] || 0;
        }
        get patch() {
            return this._version[2] || 0;
        }
        get tag() {
            return this._tag;
        }
        get isPreRelease() {
            return !!this._tag;
        }
        constructor(verOrMajor, minor, patch, tag) {
            if (Array.isArray(verOrMajor)) {
                this._version = [...verOrMajor];
                this._tag = "";
            }
            else if (typeof verOrMajor === "object") {
                this._version = [
                    verOrMajor.major || 0,
                    verOrMajor.minor || 0,
                    verOrMajor.patch || 0
                ];
                this._tag = verOrMajor.tag || "";
            }
            else if (typeof verOrMajor === "string") {
                const parts = verOrMajor.split("-");
                this._version = parts[0].split(".")
                    .map(s => parseInt(s, 10))
                    .filter(n => !isNaN(n));
                this._tag = parts[1] || "";
                return;
            }
            else {
                this._version = [verOrMajor, minor !== null && minor !== void 0 ? minor : 0, patch !== null && patch !== void 0 ? patch : 0];
                this._tag = tag !== null && tag !== void 0 ? tag : "";
            }
            this.ensureVersionIsThreeNumbers();
        }
        ensureVersionIsThreeNumbers() {
            while (this._version.length < 3) {
                this._version.push(0);
            }
            const dropped = this._version.splice(3);
            if (dropped.length) {
            }
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
            const ver = this.version.join(".");
            return !!this._tag
                ? `${ver}-${this._tag}`
                : ver;
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
