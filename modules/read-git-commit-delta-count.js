"use strict";
(function () {
    const path = require("path"), env = requireModule("env"), debug = requireModule("debug")(__filename), ZarroError = requireModule("zarro-error"), exec = requireModule("exec");
    module.exports = async function findGitCommitDeltaCount(main, branched) {
        const diffLine = `${main}...${branched}`;
        debug(`performing commit diff: ${diffLine}`);
        const raw = await exec("git", ["rev-list", "--left-right", "--count", diffLine], {
            suppressOutput: true,
            timeout: env.resolveNumber("GIT_VERIFY_TIMEOUT")
        }), lines = raw.trim().split("\n")
            .map(l => l.trim())
            .filter(l => !!l), matches = lines[0].match(/(\d*)\s*(\d*)/);
        if (matches === null) {
            throw new ZarroError(`failed to read git rev-list at ${process.cwd()}`);
        }
        return {
            behind: parseInt(matches[1], 10),
            ahead: parseInt(matches[2], 10)
        };
    };
})();
