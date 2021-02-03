"use strict";
(function () {
    const readline = require("readline");
    const defaultOptions = {
        inputStream: process.stdin,
        outputStream: process.stdout,
        done: (s) => true // grab only the first line
    };
    async function ask(message, opts) {
        opts = Object.assign({}, defaultOptions, opts || {});
        const { done } = opts;
        const rl = readline.createInterface({
            input: opts.inputStream,
            output: opts.outputStream
        });
        const lines = [];
        return new Promise((resolve, reject) => {
            rl.question(message, (line) => {
                lines.push(line);
                const all = lines.join("\n");
                if (done(all)) {
                    rl.close();
                    resolve(all);
                }
            });
        });
    }
    module.exports = {
        ask
    };
})();
