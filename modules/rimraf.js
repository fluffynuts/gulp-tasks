"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const _rimraf = require("rimraf");
    module.exports = function rimraf(at, opts) {
        return new Promise((resolve, reject) => {
            _rimraf(at, opts, (err) => err
                ? reject(err)
                : resolve());
        });
    };
})();
