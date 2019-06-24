module.exports = global.requireModule = function(baseFolder, gulpTasksFolder) {
    return function(mod) {
        var modulePath = [ baseFolder, gulpTasksFolder, "modules", mod].join("/");
        return require(modulePath);
    }
};