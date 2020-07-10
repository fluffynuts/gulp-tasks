(function() {
  const
    safeGit = requireModule<SafeGit>("safe-git"),
    Git = require("simple-git/promise");
  module.exports = async function readAllBranches(at?: string): Promise<string[]> {
    return safeGit(async () => {
      const
        git = new Git(at ?? "."),
        branches = await git.branch(["-a"]);
      return branches.all;
    }, [])
  }
})();
