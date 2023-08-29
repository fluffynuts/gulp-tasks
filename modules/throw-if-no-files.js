"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const es = require("event-stream");
    module.exports = function (msg) {
        const captured = [];
        return es.through(function write(file) {
            captured.push(file);
            this.emit("data", file);
        }, function end() {
            if (captured.length === 0) {
                return this.emit("error", msg || "No files processed");
            }
            this.emit("end");
        });
    };
})();
