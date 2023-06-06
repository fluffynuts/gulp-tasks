"use strict";
(function () {
    const { ZarroError } = requireModule("zarro-error");
    const { currentShortSHA } = requireModule("git-sha");
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
            incrementAt(parts, toIncrement, incrementBy);
            if (zeroLowerOrder) {
                zeroFrom(parts, toIncrement + 1);
            }
        }
        const result = parts.join(".");
        if (strategy != "prerelease") {
            return result;
        }
        const sha = currentShortSHA();
        return `${result}-${timestamp()}-${sha}`;
    };
    function timestamp() {
        const now = new Date(Date.now()), year = `${now.getFullYear()}`.substring(2), month = zeroPad(now.getMonth() + 1), day = zeroPad(now.getDate()), hour = zeroPad(now.getHours()), minute = zeroPad(now.getMinutes());
        return [
            year,
            month,
            day,
            hour,
            minute
        ].join("");
    }
    function zeroPad(i) {
        return i < 10 ? `0${i}` : `${i}`;
    }
})();
