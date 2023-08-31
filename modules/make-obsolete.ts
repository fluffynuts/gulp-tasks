(function() {
    module.exports = function makeObsolete(
        module: any,
        data: ObsoleteWarning
    ) {
        return;
        if (!module) {
            throw new Error(`module not set`);
        }
        module["__obsolete_warning__"] = data;
        return module;
    }

})();
