"use strict";
function zeroFrom(parts, startIndex) {
    for (let i = startIndex; i < parts.length; i++) {
        parts[i] = 0;
    }
}
function incrementAt(parts, index) {
    if (parts[index] === undefined) {
        throw new Error(`version '${parts.join(".")}' has no value at position ${index}`);
    }
    parts[index]++;
}
const incrementLookup = {
    "major": 0,
    "minor": 1,
    "patch": 2
};
module.exports = function incrementVersion(version, strategy, zeroLowerOrder) {
    const parts = version.split(".").map(i => parseInt(i));
    let toIncrement = incrementLookup[(strategy || "").toLowerCase()];
    if (toIncrement === undefined) {
        throw new Error(`Unknown version increment strategy: ${strategy}\n try one of 'major', 'minor' or 'patch'`);
    }
    incrementAt(parts, toIncrement);
    if (zeroLowerOrder) {
        zeroFrom(parts, toIncrement + 1);
    }
    return parts.join(".");
};
