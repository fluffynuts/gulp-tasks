(function() {
  class LineBuffer {

    private _buffer: string = "";
    constructor(private _lineWriter: LogFunction) {
    }

    append(str: string): void {
      this._buffer += str;
      this.drain();
    }

    drain(): void {
      let idx;
      debugger;
      while ((idx = this._buffer.indexOf("\n")) > -1) {
        let part = this._buffer.substring(0, idx);
        this._buffer = this._buffer.substring(idx + 1);
        if (part[part.length - 1] === '\r') {
          part = part.substring(0, part.length - 1);
        }
        this._lineWriter(part);
      }
    }

    flush(): void {
      const buffer = this._buffer;
      this._buffer = "";
      if (buffer) {
        this._lineWriter(buffer);
      }
    }
  }

  module.exports = LineBuffer;
})();
