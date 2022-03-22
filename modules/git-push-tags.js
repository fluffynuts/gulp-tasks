"use strict";
(function () {
    const gitFactory = require("simple-git"), gutil = requireModule("gulp-util"), resolveGitRemote = requireModule("resolve-git-remote");
    async function gitPushTags(dryRun, where) {
        if (dryRun === undefined) {
            dryRun = {};
        }
        let quiet = false;
        if (typeof dryRun === "object") {
            where = dryRun.where || ".";
            quiet = dryRun.quiet || false;
            dryRun = dryRun.dryRun || false;
        }
        else if (where !== undefined) {
            gutil.log.warn(gutil.colors.red("depreciation warning: options for git-push-tags should be sent via an object"));
        }
        where = where || ".";
        const git = gitFactory(where), more = where && where !== "." ? ` (${where})` : "";
        if (dryRun) {
            if (!quiet) {
                gutil.log(gutil.colors.green(`dry run: should push tags now${more}...`));
            }
            return;
        }
        const remote = await resolveGitRemote();
        if (!remote) {
            return;
        }
        gutil.log(gutil.colors.green(`pushing tags${more}...`));
        await git.pushTags(remote);
    }
    module.exports = gitPushTags;
})();
