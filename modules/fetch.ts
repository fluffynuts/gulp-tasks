(function() {
    if (global.fetch === undefined) {
        global.fetch = require("cross-fetch");
    }
    return global.fetch;
})();
