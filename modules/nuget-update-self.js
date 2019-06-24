const
  nuget = require("./nuget");

module.exports = function (nugetPath) {
  return nuget(["update", "-self"]);
}