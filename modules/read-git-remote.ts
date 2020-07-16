(function() {
  const
    safeGit = requireModule<SafeGit>("safe-git"),
    Git = require("simple-git/promise");

  module.exports = async function readGitRemote(at?: string): Promise<string | undefined> {
    const
      git = new Git(at || ".");
    git._silentLogging = true;

    const
      all = await safeGit(() => git.getRemotes(true), []),
      first = all[0];
    if (first === undefined) {
      // no remotes, yo (it's possible)
      return undefined;
    }
    if (all.length > 1) {
      console.log(`WARNING: assuming first remote found (${ first.name }) is the one you want; otherwise specify GIT_REMOTE or GIT_OVERRIDE_REMOTE environment variable`);
    }
    return first.name;
  }
})();
