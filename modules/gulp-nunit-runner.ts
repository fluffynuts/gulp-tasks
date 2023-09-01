(function() {
    const
        path = require("path"),
        toRequire = path.join(__dirname, "gulp-nunit-runner", "index");
    module.exports = require(toRequire);
})();
