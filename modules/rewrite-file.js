const es = require("event-stream"),
  fs = requireModule("fs");

module.exports = function rewriteFile() {
  return es.through(
    function write(file) {
      const fileName = file.history[0];
      if (!fileName || !fs.existsSync(fileName)) {
        throw new Error(`Cannot rewrite ${fileName || "(no file name)"}`);
      }
      const contents = file._contents;
      if (!contents) {
        throw new Error(`Cannot read contents of ${fileName}`);
      }
      fs.writeFileSync(fileName, contents);
      this.emit("data", file);
    },
    async function end() {
      this.emit("end");
    }
  );
}

