(function() {
  const
    Git = require("simple-git");

  async function fetchGitSha(forRepo?: string) {
    const git = new Git(forRepo);
    const log = await git.log({ maxCount: 1 });
    return log.latest.hash;
  }

  // this is a bit of an hax: we're hoping that we get some
  // time between when this is fired off and when it's required
  // but the consumers of this can't do async :| so this is
  // as good as it gets, I guess.
  let currentGitSha: string = "";
  fetchGitSha()
    .then(result => currentGitSha = result)
    .catch(() => { /* ignore: this might not be a git repo yet */ });

  function currentGitSHA() {
    return currentGitSha;
  }

  function currentShortSHA() {
    return currentGitSha.substring(0, 7);
  }

  module.exports = { currentShortSHA, currentGitSHA, fetchGitSha }
})();
