"use strict";
(function () {
    class VersionInfo {
        constructor(major, minor, patch, tag) {
            this.major = major;
            this.minor = minor;
            this.patch = patch;
            this.tag = tag;
        }
        get isPreRelease() {
            return !!this.tag;
        }
        toString() {
            const version = `${this.major}.${this.minor}.${this.patch}`;
            return this.tag
                ? `${version}-${this.tag}`
                : version;
        }
    }
    function parseNugetVersion(versionStringOrFileName) {
        const withoutExtension = versionStringOrFileName.replace(/\.nupkg$/, ""), packageWithVersionAndTag = withoutExtension.split("-"), packageWithVersionParts = packageWithVersionAndTag[0].split("."), idAndVersion = collect(packageWithVersionParts);
        return new PackageVersionInfo(idAndVersion.id, new VersionInfo(idAndVersion.version[0] || 0, idAndVersion.version[1] || 0, idAndVersion.version[2] || 0, packageWithVersionAndTag[1] || ""));
    }
    class PackageVersionInfo {
        constructor(id, version) {
            this.id = id;
            this.version = version;
        }
        get isPreRelease() {
            var _a, _b;
            return (_b = (_a = this.version) === null || _a === void 0 ? void 0 : _a.isPreRelease) !== null && _b !== void 0 ? _b : true;
        }
    }
    function collect(stringParts) {
        // moving in from the right, any pure number becomes part of the version, then the
        // rest is package identifier parts
        const idParts = [], versionParts = [];
        stringParts.reverse();
        let inVersion = true;
        for (const part of stringParts) {
            if (inVersion) {
                const asNum = parseInt(part);
                if (isNaN(asNum)) {
                    idParts.push(part);
                    inVersion = false;
                }
                else {
                    versionParts.push(asNum);
                }
            }
            else {
                idParts.push(part);
            }
        }
        idParts.reverse();
        versionParts.reverse();
        return {
            id: idParts.join("."),
            version: versionParts
        };
    }
    module.exports = {
        parseNugetVersion
    };
})();
