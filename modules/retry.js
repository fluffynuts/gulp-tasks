"use strict";
(function () {
    const ZarroError = requireModule("zarro-error"), sleep = requireModule("sleep");
    async function retry(fn, attempt, maxAttempts, wait) {
        let thisAttempt = attempt !== null && attempt !== void 0 ? attempt : 0;
        const max = maxAttempts !== null && maxAttempts !== void 0 ? maxAttempts : 10;
        let waitMs = wait !== null && wait !== void 0 ? wait : 5000;
        if (waitMs < 1000) {
            waitMs *= 1000;
        }
        try {
            const result = await fn();
            return result;
        }
        catch (e) {
            if (thisAttempt >= max) {
                throw new ZarroError(`${e} (giving up after ${attempt} attempts)`);
            }
            await sleep(waitMs);
            return retry(fn, thisAttempt, max, waitMs);
        }
    }
    module.exports = retry;
})();
