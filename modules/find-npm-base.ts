(function() {
    const
        ZarroError = requireModule<ZarroError>("zarro-error"),
        { existsSync } = require("yafs"),
        path = require("path")
    let cached: Optional<string>;

    function findClosestPackageJsonFolder() {
        let current = __dirname;
        while (inNodeModulesFolder(current) || !hasPackageJson(current)) {
            const next = path.dirname(current);
            if (next === current) {
                throw new ZarroError(`Can't find a package.json, traversing up from ${ __dirname }`);
            }
            current = next;
        }
        return current;
    }

    function inNodeModulesFolder(folder: string) {
        return !!folder.match(/node_modules/);
    }

    function hasPackageJson(folder: string) {
        const test = path.join(folder, "package.json");
        if (!existsSync(test)) {
            return false;
        }
        try {
            const
                contents = require(test),
                repo = contents.repository || {},
                url = repo.url || "",
                isGulpTasks = url.match(/\/fluffynuts\/gulp-tasks$/);
            return !isGulpTasks;
        } catch (ignore) {
            return false;
        }
    }

    module.exports = function() {
        return cached || (cached = findClosestPackageJsonFolder());
    };
})();
