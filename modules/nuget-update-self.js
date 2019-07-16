const
  nuget = require("./nuget");
var updating = null;
module.exports = function (nugetPath) {
  if (updating) {
    return updating;
  }
  return updating = nuget(["update", "-self"]);
}
