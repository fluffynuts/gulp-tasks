"use strict";
(function () {
    function withEnvironment(env, replaceExistingEnvironment) {
        return new TemporaryEnvironmentRunnerImpl(env, replaceExistingEnvironment);
    }
    class TemporaryEnvironmentRunnerImpl {
        constructor(env, existingEnvironment) {
            this.env = env;
            this.replaceExistingEnvironment = existingEnvironment !== null && existingEnvironment !== void 0 ? existingEnvironment : false;
        }
        async run(fn) {
            const oldEnv = Object.assign({}, process.env);
            try {
                if (this.replaceExistingEnvironment) {
                    replaceEnv(this.env);
                }
                else {
                    augmentEnv(this.env);
                }
                return await fn();
            }
            finally {
                replaceEnv(oldEnv);
            }
        }
    }
    function replaceEnv(env) {
        for (let k of Object.keys(process.env)) {
            delete process.env[k];
        }
        augmentEnv(env);
    }
    function augmentEnv(env) {
        for (let k of Object.keys(env)) {
            process.env[k] = env[k];
        }
    }
    let ExistingEnvironment;
    (function (ExistingEnvironment) {
        ExistingEnvironment[ExistingEnvironment["keep"] = 0] = "keep";
        ExistingEnvironment[ExistingEnvironment["drop"] = 1] = "drop";
    })(ExistingEnvironment || (ExistingEnvironment = {}));
    module.exports = {
        withEnvironment,
        ExistingEnvironment
    };
})();
