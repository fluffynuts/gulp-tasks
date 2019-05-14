const
  Git = require("simple-git"),
  gutil = require("gulp-util"),
  git = new Git();

module.exports = function gitPushTags() {
  return new Promise((resolve, reject) => {
    gutil.log(gutil.colors.green("pushing tags..."));
    git.pushTags("origin", err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
