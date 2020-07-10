(function() {
  const
    safeGit = requireModule<SafeGit>("safe-git"),
    Git = require("simple-git/promise");
  async function fetchRawGitRemoteOutput(git: any): Promise<string | undefined> {
    return safeGit(() => git.remote([]));
  }

  module.exports = async function readGitRemote(at?: string): Promise<string | undefined> {
    const
      git = new Git(at || ".");
    git._silentLogging = true;
    const raw = await fetchRawGitRemoteOutput(git);
    if (raw === undefined) {
      return undefined;
    }
    const
      all = raw.trim().split("\n").map((remote: string) => remote.trim()),
      first = all[0] === "" ? undefined : all[0];

    if (all.length > 1) {
      console.log(`WARNING: assuming first remote found (${ first }) is the one you want; otherwise specify GIT_REMOTE or GIT_OVERRIDE_REMOTE environment variable`);
    }
    return first;
  }
})();
