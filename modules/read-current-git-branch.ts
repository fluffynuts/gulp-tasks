(function() {
  const
    safeGit = requireModule<SafeGit>("safe-git"),
    Git = require("simple-git/promise");

  module.exports = async function readCurrentBranch(at?: string): Promise<string | undefined> {
    return safeGit(async () => {
      const
        git = new Git(at ?? "."),
        branchInfo = await git.branch();
      return branchInfo.current === "" ? undefined : branchInfo.current;
    });
  }
})();
