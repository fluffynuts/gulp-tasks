"use strict";
(function () {
    const gulpVersion = requireModule("gulp-version");
    if (gulpVersion.major === 3) {
        module.exports = require("run-sequence");
    }
    else {
        const setTaskName = requireModule("set-task-name");
        // it's shim time, baby!
        const gulp = requireModule("gulp");
        module.exports = function () {
            const args = Array.from(arguments), callback = args.pop(), composite = gulp.series.apply(gulp, args);
            if (typeof callback !== "function") {
                throw new Error(`runSequence should be called with any number of arguments, the last of which is a callback for when the sequence is completed`);
            }
            setTaskName(composite, "(sequence)");
            composite((err) => {
                if (err) {
                    throw err;
                }
                callback();
            });
        };
    }
})();
