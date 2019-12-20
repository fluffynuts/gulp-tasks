const
  Git = require("simple-git/promise"),
  gutil = requireModule("gulp-util"),
  git = new Git();

module.exports = async function gitTag(tag, comment) {
  gutil.log(gutil.colors.cyan(`Tagging at: "${tag}"`));
  await git.addAnnotatedTag(tag, comment);
}
