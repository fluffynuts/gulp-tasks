"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _rimraf = require("rimraf");
function rimraf(at, opts) {
    return new Promise((resolve, reject) => {
        _rimraf(at, opts, (err) => err
            ? reject(err)
            : resolve());
    });
}
exports.rimraf = rimraf;
