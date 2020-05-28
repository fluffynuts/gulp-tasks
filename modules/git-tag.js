const
  Git = require("simple-git/promise"),
  gutil = requireModule("gulp-util");

async function gitTag(tag, comment, where) {
  let dryRun = false;
  if (typeof tag === "object") {
    comment = tag.comment;
    where = tag.where || ".";
    dryRun = tag.dryRun || false;
    tag = tag.tag;
  } else {
    gutil.log.warn(
      gutil.colors.red(
        "depreciation warning: options for git-tag should be sent via an object"
      )
    );
  }
  if (!(tag || "").trim()) {
    throw new Error("No tag supplied!");
  }
  comment = comment || `:bookmark: tagging ${where} at ${tag}`;
  if (dryRun) {
    gutil.log(gutil.colors.green(`would tag at ${tag} with comment: ${comment}`));
  } else {
    const git = new Git(where);
    gutil.log(gutil.colors.cyan(`Tagging ${where} at: "${tag}"`));
    await git.addAnnotatedTag(tag, comment);
  }
}

module.exports = gitTag;
