/*
 * Welcome new user! To get started, ensure that you have copied
 * the start/packages.json alongside this file, in the root of your repo.
 * Then do:
 * > npm install
 * After that, you can:
 * > node node_modules/gulp/bin/gulp.js
 * OR, install gulp globally:
 * > npm install -g gulp
 * and then you can just:
 * > gulp
 * I HIGHLY recommend using the first method at your build server
 *
 * To add or change tasks, do so one task per file in the gulp-tasks folder
 */
var fs = require('fs');
var gulpTasksFolder = 'gulp-tasks'; // if you cloned elsewhere, you'll need to modify this
global.requireModule = function(module) {
    var modulePath = ['.', gulpTasksFolder, 'modules', module].join('/');
    return require(modulePath);
};
var fs = require('fs');
if (!fs.existsSync('package.json')) {
    ['You\'re nearly there!',
     'Please copy the package.json from the start folder alongside your gulpfile.js',
     'then run `npm install` to install the required packages'].forEach(function(s) {
        console.log(s);
     });
    process.exit(1);
}
try {
    var requireDir = require('require-dir');
    requireDir('gulp-tasks');
    var overridesFolder = 'override-tasks';
    if (fs.existsSync(overridesFolder)) {
        requireDir(overridesFolder);
    }
} catch (e) {
    process.exit(1);
}
