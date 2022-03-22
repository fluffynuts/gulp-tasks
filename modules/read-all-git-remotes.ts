import { RemoteWithRefs } from "simple-git";

(function() {
  const
    gitFactory = require("simple-git"),
    safeGit = requireModule<SafeGit>("safe-git");
  module.exports = async function readAllRemotes(at?: string): Promise<GitRemote[]> {
    return safeGit(async () => {
      // technically, a remote can have different urls for fetch and push,
      // but that's an edge-case which just complicates things
      const
        git = gitFactory(at ?? "."),
        result = await git.getRemotes(true);
      return result.map((r: RemoteWithRefs) => {
        const
          url = r.refs.fetch || r.refs.push,
          usage = resolveUsage(!!r.refs.fetch, !!r.refs.push),
          name = r.name;
        return {
          name,
          url,
          usage
        };
      })
    }, []);
  }

  function resolveUsage(fetch: boolean, push: boolean) {
    if (fetch && push) {
      return LocalGitRemoteUsage.fetchAndPush as unknown as GitRemoteUsage;
    }
    return fetch
      ? LocalGitRemoteUsage.fetch as unknown as GitRemoteUsage
      : LocalGitRemoteUsage.push as unknown as GitRemoteUsage;
  }

  // hack: can't import the global def, but we need these values
  // for the transpiled js
  enum LocalGitRemoteUsage {
    fetch,
    push,
    fetchAndPush
  }
})();
