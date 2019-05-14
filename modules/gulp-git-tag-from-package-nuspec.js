const
  PLUGIN_NAME = __filename.replace(/\.js$/, ""),
  gutil = require("gulp-util"),
  Git = require("simple-git"),
  loadXmlFile = requireModule("load-xml-file"),
  es = require("event-stream"),
  gitTag = requireModule("git-tag"),
  gitPushTags = requireModule("git-push-tags"),
  gitPush = requireModule("git-push");
  defaultOptions = {
    push: true
  };
module.exports = function gitTagFromPackageNuspec(options) {
  options = Object.assign({}, defaultOptions, options);
  const nuspecs = [];
  return es.through(
    async function write(file) {
      nuspecs.push(file.path);
      this.emit("data", file);
    },
    async function end() {
      if (nuspecs.length == 0) {
        throw new Error("no nuspecs found to tag from?");
      }
      if (nuspecs.length > 1) {
        throw new Error(
          `too many nuspecs! specify the one to use for creating a versioned tag!\n${nuspecs.join(
            "\n- "
          )}`
        );
      }
      const xml = await loadXmlFile(nuspecs[0]),
        version = xml.package.metadata[0].version[0].trim();

      try {
        await gitTag(`v${version}`, `:bookmark: ${version}`);
        if (options.push) {
          await gitPushTags();
          await gitPush();
          gutil.log(gutil.colors.green("-> all commits and tags pushed!"));
        }
        this.emit("end");
      } catch (e) {
        this.emit("error", new gutil.PluginError(PLUGIN_NAME, e));
      }
    }
  );
};
