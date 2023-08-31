"use strict";
(function () {
    module.exports = function longestStringLength(arr) {
        if (!arr || arr.length === 0) {
            return 0;
        }
        if (!Array.isArray(arr)) {
            arr = [arr];
        }
        return arr.reduce((acc, cur) => {
            const currentLength = ((cur || "").toString()).length;
            return acc > currentLength ? acc : currentLength;
        }, 0);
    };
})();
