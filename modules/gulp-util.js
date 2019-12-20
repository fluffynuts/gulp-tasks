const
  gulpVersion = requireModule("gulp-version");

if (gulpVersion.major === 3) {
    module.exports = requireModule("gulp-util");
} else {
    // gulp-util is deprecated in 4 :/
    module.exports = {
        PluginError: require("plugin-error"),
        log: require("fancy-log"),
        colors: require("ansi-colors")
    }
}
