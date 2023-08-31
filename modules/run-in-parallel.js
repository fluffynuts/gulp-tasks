"use strict";
(function () {
    module.exports = async function runInParallel(maxConcurrency, ...actions) {
        const toRun = [...actions];
        const batch = toRun.splice(0, maxConcurrency)
            .map(a => {
            return a().then(() => {
                const n = next();
                return n();
            });
        });
        await Promise.all(batch);
        function next() {
            const result = toRun.shift();
            if (result) {
                return () => result().then(next());
            }
            return noop;
        }
    };
    function noop() {
        return Promise.resolve();
    }
})();
