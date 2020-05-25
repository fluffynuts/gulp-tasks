"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    // collects the files from a gulp stream
    const es = require("event-stream");
    module.exports = function collectFiles(target) {
        const stream = es.through(function data(file) {
            target.push(file);
            stream.emit("data", file);
        }, function end() {
            stream.emit("end");
        });
        return stream;
    };
})();
