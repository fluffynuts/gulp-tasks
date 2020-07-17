const
  exec = requireModule("exec");
let updating = null;
module.exports = function (nugetPath) {
  if (updating) {
    return updating;
  }
  return exec(nugetPath, [ "update", "-self" ]);
}
