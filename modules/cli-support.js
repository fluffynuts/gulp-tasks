"use strict";
(function () {
    const q = requireModule("quote-if-required");
    function pushIfSet(args, value, cliSwitch) {
        if (value) {
            args.push(cliSwitch, q(`${value}`));
        }
    }
    function pushFlag(args, value, cliSwitch) {
        if (value) {
            args.push(cliSwitch);
        }
    }
    module.exports = {
        pushIfSet,
        pushFlag
    };
})();
