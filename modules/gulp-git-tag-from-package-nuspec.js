"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const PLUGIN_NAME = __filename.replace(/\.js$/, ""), gutil = requireModule("gulp-util"), loadXmlFile = requireModule("load-xml-file"), es = require("event-stream"), gitTag = requireModule("git-tag"), gitPushTags = requireModule("git-push-tags"), gitPush = requireModule("git-push"), { parseNugetVersion } = requireModule("parse-nuget-version"), { ZarroError } = requireModule("zarro-error"), defaultOptions = {
        push: true,
        dryRun: false,
        ignorePreRelease: true
    };
    module.exports = function gitTagFromPackageNuspec(options) {
        options = Object.assign({}, defaultOptions, options);
        const nuspecs = [];
        return es.through(async function write(file) {
            nuspecs.push(file.path);
            this.emit("data", file);
        }, async function end() {
            if (nuspecs.length == 0) {
                throw new ZarroError("no nuspecs found to tag from?");
            }
            if (nuspecs.length > 1) {
                throw new ZarroError(`too many nuspecs! specify the one to use for creating a versioned tag!\n${nuspecs.join("\n- ")}`);
            }
            const xml = await loadXmlFile(nuspecs[0]), version = xml.package.metadata[0].version[0].trim(), versionInfo = parseNugetVersion(version);
            if (options.dryRun) {
                console.log(`Dry run: would have tagged at ${version}`);
                return this.emit("end");
            }
            if (versionInfo.isPreRelease && options.ignorePreRelease) {
                console.log(`Not tagging: this is a pre-release. Set ignorePreRelease: false on options to tag pre-releases.`);
                return this.emit("end");
            }
            try {
                await gitTag(`v${version}`, `:bookmark: ${version}`);
                if (options.push) {
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
})();
