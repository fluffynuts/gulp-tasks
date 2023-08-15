(function() {
  const
    ZarroError = requireModule<ZarroError>("zarro-error"),
    gitFactory = require("simple-git"),
    env = requireModule<Env>("env"),
    gutil = requireModule<GulpUtil>("gulp-util");

  async function gitTag(
    tag: string | GitTagOptions,
    comment?: string,
    where?: string
  ) {
    let dryRun = false;
    if (typeof tag === "object") {
      comment = tag.comment;
      where = tag.where || ".";
      dryRun = tag.dryRun || env.resolveFlag(env.DRY_RUN);
      tag = tag.tag;
    } else if (comment !== undefined) {
      gutil.log.warn(
        gutil.colors.red(
          "depreciation warning: options for git-tag should be sent via an object"
        )
      );
    }
    if (!(tag || "").trim()) {
      throw new ZarroError("No tag supplied!");
    }
    const more = where === "." ? "" : ` ${ where }`;
    comment = comment || `:bookmark: tagging${ more } at ${ tag }`;
    where = where || ".";
    if (dryRun) {
      gutil.log(gutil.colors.green(`dry run: would tag${ more } at ${ tag } with comment: ${ comment }`));
    } else {
      const git = gitFactory(where);
      gutil.log(gutil.colors.cyan(`Tagging${ more } at: "${ tag }"`));
      await git.addAnnotatedTag(tag, comment);
    }
  }

  module.exports = gitTag;
})();
