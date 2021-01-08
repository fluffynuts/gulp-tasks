"use strict";
(function () {
    const es = require("event-stream"), fs = requireModule("fs");
    function rewriteFile(transform) {
        return es.through(function write(file) {
            const fileName = file.history[0];
            if (!fileName || !fs.existsSync(fileName)) {
                throw new Error(`Cannot rewrite ${fileName || "(no file name)"}`);
            }
            let contents = file._contents;
            if (!contents) {
                throw new Error(`Cannot read contents of ${fileName}`);
            }
            if (transform) {
                contents = transform(contents);
            }
            fs.writeFileSync(fileName, contents);
            this.emit("data", file);
        }, async function end() {
            this.emit("end");
        });
    }
    module.exports = {
        rewriteFile
    };
})();
