"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const PLUGIN_NAME = __filename.replace(/\.js$/, ""), gutil = requireModule("gulp-util"), loadXmlFile = requireModule("load-xml-file"), es = require("event-stream"), gitTag = requireModule("git-tag"), gitPushTags = requireModule("git-push-tags"), gitPush = requireModule("git-push"), { ZarroError } = requireModule("zarro-error"), defaultOptions = {
        push: true,
        dryRun: false
    };
    module.exports = function gitTagFromCsProj(options) {
        const opts = Object.assign({}, defaultOptions, options);
        const csprojFiles = [];
        return es.through(async function write(file) {
            csprojFiles.push(file.path);
            this.emit("data", file);
        }, async function end() {
            if (csprojFiles.length == 0) {
                throw new ZarroError("no csproj files found to tag from?");
            }
            if (csprojFiles.length > 1) {
                throw new ZarroError(`too many csproj files! specify the one to use for creating a versioned tag!\n${csprojFiles.join("\n- ")}`);
            }
            const xml = await loadXmlFile(csprojFiles[0]), version = findPackageVersion(xml, csprojFiles[0]);
            if (opts.dryRun) {
                console.log(`Dry run: would have tagged at ${version}`);
                return this.emit("end");
            }
            try {
                await gitTag({
                    tag: `v${version}`,
                    comment: `:bookmark: ${version}`
                });
                if (opts.push) {
                    await gitPushTags();
                    await gitPush();
                    gutil.log(gutil.colors.green("-> all commits and tags pushed!"));
                }
                this.emit("end");
            }
            catch (e) {
                this.emit("error", new gutil.PluginError(PLUGIN_NAME, e));
            }
        });
    };
    function findPackageVersion(xml, fileName) {
        const packageVersionPropGroup = xml.Project.PropertyGroup.filter((g) => !!g.PackageVersion)[0];
        if (!packageVersionPropGroup || (packageVersionPropGroup.PackageVersion[0] || "").trim() === "") {
            throw new ZarroError(`No valid PackageVersion node found in any PropertyGroup within ${fileName}`);
        }
        return packageVersionPropGroup.PackageVersion[0].trim();
    }
})();
