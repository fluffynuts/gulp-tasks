const
  Git = require("simple-git"),
  gutil = require("gulp-util"),
  git = new Git();

module.exports = function gitPush() {
  return new Promise((resolve, reject) => {
    gutil.log(gutil.colors.green("pushing local commits..."));
    git.push("origin", "master", err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
