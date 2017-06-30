"use strict";
const gulp = require("gulp"),
    mocha = require("gulp-mocha"),
    runSequence = require("run-sequence"),
    del = require("del"),
    debug = require("gulp-debug"),
    ProgressReporter = require("mocha-yar");

ProgressReporter.setOptions({
    time: {
        total: true,
        test: true
    },
    impatient: false
});

const runTests = function (watching) {
    return gulp.src(["**/*.spec.js"])
        .pipe(debug())
        .pipe(mocha({
            reporter: watching ? "mocha-yar" : "spec"
        })).on("error", function () {
            this.emit("end");
        });
};


function tryDo(fn, resolve, reject) {
    try {
        fn();
        resolve();
    } catch (e) {
        reject(e);
    }
}
gulp.task("watch", function () {
    return new Promise((resolve, reject) => {
        tryDo(() => {
            runTests(true);
            const watcher = gulp.watch(["../**/*.js"], () => runTests(true));
            watcher.on("change", function (ev) {
                console.log("-> " + ev.type + ": " + ev.path)
            })
        }, resolve, reject);
    });
});

gulp.task("test-once", function () {
    return runTests(false);
});