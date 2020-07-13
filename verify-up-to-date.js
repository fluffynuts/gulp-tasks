"use strict";
(function () {
    const env = requireModule("env"), gulp = requireModule("gulp");
    gulp.task("verify-up-to-date", () => {
        // TODO: resolve branch to test against from env
        // TODO: get the delta count & chuck if behind
        return Promise.resolve();
    });
})();
