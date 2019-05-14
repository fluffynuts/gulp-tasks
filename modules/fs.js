const fs = require("fs");

function promisify(func, parent) {
  return function() {
    const args = Array.from(arguments);
    return new Promise((resolve, reject) => {
      args.push((err, data) => {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
      func.apply(parent || fs, args);
    });
  }
}

module.exports = {
  stat: promisify(fs.stat),
  readFile: promisify(fs.readFile),
  readdir: promisify(fs.readdir)
};
