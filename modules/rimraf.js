"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const _rimraf = require("rimraf");
    module.exports = function rimraf(at, opts) {
        return new Promise((resolve, reject) => {
            if (opts) {
                // the rimraf module doesn't test if options are undefined
                // -> it tests if options is a function and shifts args :/
                _rimraf(at, opts, (err) => err
                    ? reject(err)
                    : resolve());
            }
            else {
                _rimraf(at, (err) => err
                    ? reject(err)
                    : resolve());
            }
        });
    };
})();
