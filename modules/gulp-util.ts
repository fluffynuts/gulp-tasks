(function() {
    module.exports = {
        PluginError: require("plugin-error"),
        log: require("fancy-log"),
        colors: require("ansi-colors")
    } satisfies GulpUtil;
})()
