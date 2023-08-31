(function() {
    const { redBright } = require("./ansi-colors") as AnsiColors;

    module.exports = function reportObsolete(
        mod: string,
        module: any
    ) {
        return;
        const warning = module["__obsolete_warning__"] as ObsoleteWarning;
        if (!warning) {
            return;
        }
        console.warn(redBright(`module '${mod}' is obsolete and may be removed after ${warning.expires}`));
        console.warn(redBright(`  ${warning.reason}`));
    }
})();
