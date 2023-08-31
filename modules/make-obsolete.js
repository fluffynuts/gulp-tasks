"use strict";
(function () {
    module.exports = function makeObsolete(module, data) {
        if (!module) {
            throw new Error(`module not set`);
        }
        module["__obsolete_warning__"] = data;
        return module;
    };
})();
