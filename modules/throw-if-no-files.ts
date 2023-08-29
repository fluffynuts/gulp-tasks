import { Stream } from "stream";
import { BufferFile } from "vinyl";

(function() {
    const
        es = require("event-stream");

    module.exports = function(
        msg: string
    ): Stream {
        const captured = [] as BufferFile[];
        return es.through(function write(this: Stream, file: BufferFile) {
            captured.push(file);
            this.emit("data", file);
        }, function end(this: Stream) {
            if (captured.length === 0) {
                return this.emit("error", msg || "No files processed");
            }
            this.emit("end");
        });
    };
})();
