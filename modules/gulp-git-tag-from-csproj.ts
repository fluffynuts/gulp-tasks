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
    { ZarroError } = requireModule("zarro-error"),
    defaultOptions = {
      push: true,
      dryRun: false
    } as Partial<GitTagOptions>;

  module.exports = function gitTagFromCsProj(options?: GitTagFromCsProjOptions) {
    const opts = Object.assign({}, defaultOptions, options) as GitTagFromCsProjOptions;
    const csprojFiles: string[] = [];
    return es.through(
      async function write(this: Stream, file: vinyl.BufferFile) {
        csprojFiles.push(file.path);
        this.emit("data", file);
      },
      async function end(this: Stream) {
        if (csprojFiles.length == 0) {
          throw new ZarroError("no csproj files found to tag from?");
        }
        if (csprojFiles.length > 1) {
          throw new ZarroError(
            `too many csproj files! specify the one to use for creating a versioned tag!\n${ csprojFiles.join(
              "\n- "
            ) }`
          );
        }
        const xml = await loadXmlFile(csprojFiles[0]),
          version = findPackageVersion(xml, csprojFiles[0]);
        if (opts.dryRun) {
          console.log(`Dry run: would have tagged at ${ version }`);
          return this.emit("end");
        }
        try {
          await gitTag({
            tag: `v${ version }`,
            comment: `:bookmark: ${ version }`
          });
          if (opts.push) {
            await gitPushTags();
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

  function findPackageVersion(xml: any, fileName: string) {
    const packageVersionPropGroup = xml.Project.PropertyGroup.filter(
      (g: any) => !!g.PackageVersion
    )[0];
    if (!packageVersionPropGroup || (packageVersionPropGroup.PackageVersion[0] || "").trim() === "") {
      throw new ZarroError(`No valid PackageVersion node found in any PropertyGroup within ${ fileName }`);
    }
    return packageVersionPropGroup.PackageVersion[0].trim();
  }
})();
