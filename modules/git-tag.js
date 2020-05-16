const
  Git = require("simple-git/promise"),
  gutil = requireModule("gulp-util");

module.exports = async function gitTag(tag, comment, where) {
  const git = new Git(where);
  gutil.log(gutil.colors.cyan(`Tagging at: "${tag}"`));
  comment = comment || `:bookmark: tagging at ${tag}`;
  await git.addAnnotatedTag(tag, comment);
}
