"use strict";
(function () {
    const gulp = requireModule("gulp");
    gulp.task("generate-reports", "runs 'default-report-generator'", ["default-report-generator"], () => Promise.resolve());
})();
