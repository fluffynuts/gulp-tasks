"use strict";
(function () {
    const runSequence = requireModule("run-sequence");
    async function runTask(task) {
        return new Promise(resolve => {
            runSequence(task, resolve);
        });
    }
    async function runSeries(...tasks) {
        for (const task of tasks) {
            await runTask(task);
        }
    }
    async function runParallel(...tasks) {
        const promises = tasks.map(t => runTask(t));
        await Promise.all(promises);
    }
    module.exports = {
        runTask,
        runSeries,
        runParallel
    };
})();
