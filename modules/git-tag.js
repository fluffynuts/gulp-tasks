const
  Git = require("simple-git/promise"),
  gutil = require("gulp-util"),
  git = new Git();

module.exports = function gitTag(tag, comment) {
  gutil.log(gutil.colors.cyan(`Tagging at: "${tag}"`));
  await git.addAnnotatedTag(tag, comment);
}
