(function() {
    if (global.fetch === undefined) {
        global.fetch = require("cross-fetch");
    }
    module.exports = global.fetch;
})();
