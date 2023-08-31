(function() {
    const
        system = require("system"),
        log = requireModule<Log>("log"),
        { rm } = require("yafs");

    module.exports = async function(path: string): Promise<void> {
        console.log("verifying executable at: ", path);
        try {
            await system(
                path,
                [], {
                    suppressOutput: true,
                    timeout: 100
                }
            );
        } catch (e) {
            log.error("-> executable is bad )': (imma delete it!)");
            log.info("Suggestion: add a nuget.exe binary to the folder hosting your gulp-tasks");
            await rm(path);
        }
    };
})();
