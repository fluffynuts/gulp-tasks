(function() {
  const exec = requireModule<Exec>("exec");

  module.exports = async function readMainBranchName(): Promise<string | undefined> {
    const
      all = await listBranchesRaw("*"),
      headRef = all.map(b => {
        const match = b.match(/HEAD -> (.*)/);
        return match
          ? match[1]
          : ""
      }).filter(b => !!b)[0],
      currentlyCheckedOut = (all.find(l => l.startsWith("* ")) || "")
        .replace(/^\*\s*/, ""); // should get something like "origin/master"
    // we don't want "origin" (or whatever the upstream is called)
    if (!headRef) {
      return currentlyCheckedOut;
    }
    return headRef.split("/").slice(1).join("/");
  }

  async function listBranchesRaw(spec?: string): Promise<string[]> {
    if (!spec) {
      spec = "*";
    }
    const raw = await git("branch", "-a", "--list", spec);
    return (
      raw || ""
    ).split("\n");
  }

  async function git(...args: string[]) {
    return exec("git", args, { suppressOutput: true });
  }

})();
