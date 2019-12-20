const git = require("simple-git/promise");

module.exports = async function readCurrentBranch() {
  const branchInfo = await git().branch();
  return branchInfo.current;
}
