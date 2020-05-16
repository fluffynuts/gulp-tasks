"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml2js_1 = require("xml2js");
module.exports = function parseXml(data) {
    return new Promise((resolve, reject) => {
        const parser = new xml2js_1.Parser();
        parser.parseString(data, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
};
