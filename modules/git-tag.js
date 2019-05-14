const
  Git = require("simple-git"),
  gutil = require("gulp-util"),
  git = new Git();

module.exports = function gitTag(tag, comment) {
  return new Promise((resolve, reject) => {
    gutil.log(gutil.colors.cyan(`Tagging at: "${tag}"`));
    git.addAnnotatedTag(tag, comment, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
