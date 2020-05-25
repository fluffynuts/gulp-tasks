import * as vinyl from "vinyl";

(function() {
  // collects the files from a gulp stream
  const
    es = require("event-stream");
  module.exports = function collectFiles(target: vinyl.BufferFile[]) {
    const stream = es.through(function data(file: vinyl.BufferFile) {
      target.push(file);
      stream.emit("data", file);
    }, function end() {
      stream.emit("end");
    });
    return stream;
  }
})();
