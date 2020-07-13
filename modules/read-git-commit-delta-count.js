"use strict";
(function () {
    const exec = requireModule("exec"), env = requireModule("env");
    module.exports = async function findGitCommitDeltaCount(main, branched) {
        const raw = await exec("git", ["rev-list", " --left-right", "--count", `${main}...${branched}`]), lines = raw.trim().split("\n")
            .map(l => l.trim())
            .filter(l => !!l), matches = lines[0].match(/(\d*)\s*(\d*)/);
        if (matches === null) {
            throw new Error(`failed to read git rev-list at ${process.cwd()}`);
        }
        return {
            behind: parseInt(matches[1], 10),
            ahead: parseInt(matches[2], 10)
        };
    };
})();
