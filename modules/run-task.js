"use strict";
(function () {
    const runSequence = requireModule("run-sequence");
    async function runTask(task) {
        return new Promise(resolve => {
            runSequence(task, resolve);
        });
    }
    module.exports = {
        runTask
    };
})();
