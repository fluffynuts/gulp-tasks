"use strict";
(function () {
    class LineBuffer {
        constructor(_lineWriter) {
            this._lineWriter = _lineWriter;
            this._buffer = "";
        }
        append(data) {
            const str = data instanceof Buffer
                ? data.toString()
                : data;
            this._buffer += str;
            this.drain();
        }
        drain() {
            let idx;
            while ((idx = this._buffer.indexOf("\n")) > -1) {
                let part = this._buffer.substring(0, idx);
                this._buffer = this._buffer.substring(idx + 1);
                if (part[part.length - 1] === "\r") {
                    part = part.substring(0, part.length - 1);
                }
                this._lineWriter(part);
            }
        }
        flush() {
            const buffer = this._buffer;
            this._buffer = "";
            if (buffer) {
                this._lineWriter(buffer);
            }
        }
    }
    module.exports = LineBuffer;
})();
