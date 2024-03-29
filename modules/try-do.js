"use strict";
(function () {
    const env = requireModule("env"), chalk = requireModule("ansi-colors");
    async function tryDo(logic, retries, onTransientError, onFinalFailure) {
        // always attempt at least once
        const requestedRetries = typeof retries === "string"
            ? env.resolveNumber(retries)
            : retries;
        let totalAttempts = requestedRetries + 1;
        if (totalAttempts < 0) {
            totalAttempts = 1;
        }
        let retryCount = 0;
        while (totalAttempts-- > 0) {
            try {
                const result = await logic();
                return result;
            }
            catch (ex) {
                const e = ex;
                if (totalAttempts > 0) {
                    if (onTransientError) {
                        onTransientError(e);
                    }
                    else {
                        console.log(chalk.red(`Error: ${e.message || e.toString()}`));
                    }
                    console.log(chalk.green(`Retrying (${++retryCount} / ${requestedRetries})`));
                }
                else {
                    if (requestedRetries < 1) {
                        if (onFinalFailure) {
                            await onFinalFailure();
                        }
                        else {
                            console.log(chalk.magentaBright(`Failed after ${totalAttempts} attempts`));
                            if (typeof retries === "string") {
                                if (process.env[retries] === undefined) {
                                    console.info(chalk.yellow(`If the error looks transient, try setting the '${retries}' environment variable.`));
                                }
                                else {
                                    console.info(chalk.yellow(`If the error looks transient, try setting the '${retries}' environment variable to a larger value (currently: ${process.env[retries]})`));
                                }
                            }
                        }
                    }
                    throw e;
                }
            }
        }
        throw new Error("Should have either completed or thrown by now");
    }
    module.exports = tryDo;
})();
