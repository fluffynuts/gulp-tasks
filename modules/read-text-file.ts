(function () {
  const fs = require("fs");

  module.exports = async function readTextFile(at: string) {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(at, { encoding: "utf8" }, (err: Error, data: string) => {
        if (err) {
          return reject(err);
        }
        resolve(data.toString());
      });
    });
  };
})();
