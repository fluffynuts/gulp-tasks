"use strict";
(function () {
    const fs = require("fs");
    module.exports = async function readTextFile(at) {
        return new Promise((resolve, reject) => {
            fs.readFile(at, { encoding: "utf8" }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data.toString());
            });
        });
    };
})();
