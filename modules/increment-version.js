"use strict";
(function () {
    const ZarroError = requireModule("zarro-error"), generateVersionSuffix = requireModule("generate-version-suffix");
    function zeroFrom(parts, startIndex) {
        for (let i = startIndex; i < parts.length; i++) {
            parts[i] = 0;
        }
    }
    function incrementAt(parts, index, incrementBy) {
        if (parts[index] === undefined) {
            throw new ZarroError(`version '${parts.join(".")}' has no value at position ${index}`);
        }
        parts[index] += incrementBy;
    }
    const incrementLookup = {
        "prerelease": -1,
        "major": 0,
        "minor": 1,
        "patch": 2
    };
    module.exports = function incrementVersion(version, strategy, zeroLowerOrder = true, incrementBy = 1) {
        const dashedParts = version.split("-"), parts = dashedParts[0].split(".").map(i => parseInt(i));
        let toIncrement = incrementLookup[(strategy || "").toLowerCase()];
        if (toIncrement === undefined) {
            throw new ZarroError(`Unknown version increment strategy: ${strategy}\n try one of 'major', 'minor' or 'patch'`);
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
        }
        else {
            // bump the minor if this is the first pre-release
            if (dashedParts.length === 1) {
                incrementAt(parts, 2, 1);
            }
        }
        const result = parts.join(".");
        if (strategy != "prerelease") {
            return result;
        }
        return `${result}-${generateVersionSuffix()}`;
    };
})();
