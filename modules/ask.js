"use strict";
(function () {
    const readline = require("readline");
    const defaultOptions = {
        inputStream: process.stdin,
        outputStream: process.stdout,
        validator: (s) => true // grab only the first answer, irrespective of what it is
    };
    async function ask(message, opts) {
        opts = Object.assign({}, defaultOptions, opts || {});
        const { validator } = opts;
        const rl = readline.createInterface({
            input: opts.inputStream,
            output: opts.outputStream
        });
        const lines = [];
        return new Promise((resolve, reject) => {
            rl.question(format(message), (line) => {
                lines.push(line);
                const all = lines.join("\n");
                if (validator(all)) {
                    rl.close();
                    resolve(all);
                }
            });
        });
    }
    function format(message) {
        if (!message) {
            throw new Error(`no message provided to ask with `);
        }
        if (message.match(/\s+$/)) {
            return message; // already formatted
        }
        if (message.match(/[:?]$/)) {
            return `${message} `; // just add a little space
        }
        return `${message}: `; // assume this is a prompt of some kind
    }
    module.exports = {
        ask
    };
})();
