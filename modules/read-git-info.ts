import path from "path";

(function() {
  const
    fs = requireModule<FileSystemUtils>("fs"),
    readAllGitRemotes = requireModule<ReadAllGitRemotes>("read-all-git-remotes"),
    readGitRemote = requireModule<ReadGitRemote>("read-git-remote"),
    readAllGitBranches = requireModule<ReadAllGitBranches>("read-all-git-branches"),
    readCurrentBranch = requireModule<ReadCurrentGitBranch>("read-current-git-branch");

  function isGitRepo(at?: string): Promise<boolean> {
    const dotGit = path.join(at ?? ".", ".git");
    return fs.folderExists(dotGit);
  }

  module.exports = async function readGitInfo(at?: string): Promise<GitInfo> {
    const [ currentBranch, branches, primaryRemote, remotes ] = await Promise.all([
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
    } as GitInfo;
  }
})();
