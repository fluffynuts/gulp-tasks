"use strict";
(function () {
    function flatten(arrayOrValue) {
        return arrayOrValue.reduce((acc, cur) => {
            if (Array.isArray(cur)) {
                acc.push.apply(acc, flatten(cur));
            }
            else {
                acc.push(cur);
            }
            return acc;
        }, []);
    }
    module.exports = function multiSplit(str, delimiters) {
        if (!str) {
            return [];
        }
        delimiters = delimiters || "";
        if (!Array.isArray(delimiters)) {
            delimiters = [delimiters];
        }
        return flatten(delimiters.reduce((allIterations, currentDelimiter) => {
            return allIterations.reduce((subParts, part) => {
                return subParts.concat(part.split(currentDelimiter));
            }, []);
        }, [str]));
    };
})();
