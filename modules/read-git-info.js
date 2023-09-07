"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
(function () {
    const fs = requireModule("fs"), readAllGitRemotes = requireModule("read-all-git-remotes"), readGitRemote = requireModule("read-git-remote"), readAllGitBranches = requireModule("read-all-git-branches"), readCurrentBranch = requireModule("read-current-git-branch");
    function isGitRepo(at) {
        const dotGit = path_1.default.join(at !== null && at !== void 0 ? at : ".", ".git");
        return fs.folderExists(dotGit);
    }
    module.exports = async function readGitInfo(at) {
        await readCurrentBranch(at);
        await readAllGitBranches(at);
        await readGitRemote(at);
        await readAllGitRemotes(at);
        const [currentBranch, branches, primaryRemote, remotes] = await Promise.all([
            readCurrentBranch(at),
            readAllGitBranches(at),
            readGitRemote(at),
            readAllGitRemotes(at)
        ]);
        return {
            isGitRepository: await isGitRepo(at),
            currentBranch,
            branches,
            primaryRemote,
            remotes
        };
    };
})();
