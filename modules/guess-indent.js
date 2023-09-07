"use strict";
(function () {
    function guessIndent(text) {
        if (!text) {
            return 0;
        }
        const lines = text.split("\n"), firstIndented = lines.find(line => line.match(/^\s+/));
        if (!firstIndented) {
            return 2; // guess
        }
        const firstMatch = firstIndented.match(/(^\s+)/) || [], leadingWhitespace = firstMatch[0] || "  ", asSpaces = leadingWhitespace.replace(/\t/g, "  ");
        return asSpaces.length;
    }
    module.exports = guessIndent;
})();
