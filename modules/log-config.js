"use strict";
(function () {
    const padRight = require("./pad-right"), log = requireModule("log"), chalk = requireModule("ansi-colors");
    function output(logLines) {
        const longest = logLines
            .map(o => o.title.length)
            .reduce((acc, cur) => (acc > cur ? acc : cur), 0);
        logLines
            .sort((a, b) => (a.title > b.title ? 1 : 0))
            .forEach(line => {
            const pre = chalk.yellowBright(padRight(line.title, longest)), next = chalk.cyanBright(`${line.value}`);
            log.info(`${pre} : ${next}`);
        });
    }
    function store(logLines, config, prop, title) {
        const value = config[prop];
        if (value !== undefined) {
            logLines.push({ title, value });
        }
        return logLines;
    }
    module.exports = function logConfig(config, labels) {
        const logLines = Object.keys(labels).reduce((acc, cur) => store(acc, config, cur, labels[cur]), []);
        output(logLines);
    };
})();
