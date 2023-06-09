import * as vinyl from "vinyl";
import { Stream } from "stream";

(function() {
  const
    PLUGIN_NAME = __filename.replace(/\.js$/, ""),
    gutil = requireModule<GulpUtil>("gulp-util"),
    loadXmlFile = requireModule<LoadXmlFile>("load-xml-file"),
    es = require("event-stream"),
    gitTag = requireModule<GitTag>("git-tag"),
    gitPushTags = requireModule<GitPushTags>("git-push-tags"),
    gitPush = requireModule<GitPush>("git-push"),
    { parseNugetVersion } = requireModule<ParseNugetVersion>("parse-nuget-version"),
    { ZarroError } = requireModule("zarro-error"),
    defaultOptions = {
      push: true,
      dryRun: false,
      ignorePreRelease: true
    } as Partial<GitTagOptions>;

  module.exports = function gitTagFromPackageNuspec(options: GitTagOptions) {
    options = Object.assign({}, defaultOptions, options) as GitTagOptions;
    const nuspecs = [] as string[];
    return es.through(
      async function write(this: Stream, file: vinyl.BufferFile) {
        nuspecs.push(file.path);
        this.emit("data", file);
      },
      async function end(this: Stream) {
        if (nuspecs.length == 0) {
          throw new ZarroError("no nuspecs found to tag from?");
        }
        if (nuspecs.length > 1) {
          throw new ZarroError(
            `too many nuspecs! specify the one to use for creating a versioned tag!\n${ nuspecs.join(
              "\n- "
            ) }`
          );
        }
        const
          xml = await loadXmlFile(nuspecs[0]),
          version = xml.package.metadata[0].version[0].trim(),
          versionInfo = parseNugetVersion(version);

        if (options.dryRun) {
          console.log(`Dry run: would have tagged at ${ version }`);
          return this.emit("end");
        }


        try {
          const shouldNotTag = versionInfo.isPreRelease && options.ignorePreRelease;
          if (shouldNotTag) {
            console.log(`Not tagging: this is a pre-release. Set ignorePreRelease: false on options to tag pre-releases.`);
          } else {
            await gitTag(`v${ version }`, `:bookmark: ${ version }`);
          }
          if (options.push) {
            if (!shouldNotTag) {
              await gitPushTags();
            }
            await gitPush();
            gutil.log(gutil.colors.green("-> all commits and tags pushed!"));
          }
          this.emit("end");
        } catch (e) {
          this.emit("error", new gutil.PluginError(PLUGIN_NAME, e as Error));
        }
      }
    );
  };
})();
