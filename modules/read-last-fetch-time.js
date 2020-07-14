"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
(function () {
    const { stat, fileExists } = requireModule("fs");
    module.exports = async function (at) {
        at = at !== null && at !== void 0 ? at : ".";
        const fetchHead = path_1.default.join(at, ".git", "FETCH_HEAD");
        if (!(await fileExists(fetchHead))) {
            return undefined;
        }
        const st = await stat(fetchHead);
        const result = new Date(st.mtime);
        return isNaN(result.getTime())
            ? undefined
            : result;
    };
})();
