"use strict";
(function () {
    const { redBright } = require("./ansi-colors");
    module.exports = function reportObsolete(mod, module) {
        const warning = module["__obsolete_warning__"];
        if (!warning) {
            return;
        }
        console.warn(redBright(`module '${mod}' is obsolete and may be removed after ${warning.expires}`));
        console.warn(redBright(`  ${warning.reason}`));
    };
})();
