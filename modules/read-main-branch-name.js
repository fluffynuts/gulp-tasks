"use strict";
(function () {
    const os = require("os"), exec = requireModule("exec");
    module.exports = async function readMainBranchName() {
        const all = await listBranchesRaw("*"), headRef = all.map(b => {
            const match = b.match(/HEAD -> (.*)/);
            return match
                ? match[1]
                : "";
        }).filter(b => !!b)[0], currentlyCheckedOut = (all.find(l => l.startsWith("* ")) || "")
            .replace(/^\*\s*/, ""); // should get something like "origin/master"
        // we don't want "origin" (or whatever the upstream is called)
        if (!headRef) {
            return currentlyCheckedOut;
        }
        return headRef.split("/").slice(1).join("/");
    };
    async function listBranchesRaw(spec) {
        if (!spec) {
            spec = "*";
        }
        const quotedSpec = os.platform() === "win32"
            ? spec // cmd is too dumb to expand * itself and git on windows gets the surrounding '' too, breaking the required logic
            : `'${spec}'`; // !win32 shells will not pass in the '', but, without it, attempt to expand the spec )':
        debugger;
        const raw = await git("--no-pager", "branch", "-a", "--list", quotedSpec);
        return (raw || "").split("\n");
    }
    async function git(...args) {
        return exec("git", args, { suppressOutput: true, mergeIo: true });
    }
})();
