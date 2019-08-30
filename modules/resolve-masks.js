const env = require("./env");

function isPureMask(str) {
  return str && str[0] === "(" && str[str.length - 1] === ")";
}
function extractPureMask(str) {
  return str.substr(1, str.length - 2);
}

module.exports = function resolveMasks(includeVar, excludeVar) {
  return env.resolveArray(includeVar).concat(
    env
      .resolveArray(excludeVar)
      .map(p => {
        if (isPureMask(p)) {
          // have path spec, don't do magic!
          return extractPureMask(p);
        }
        if (p.indexOf("!") === 0) {
          p = p.substr(1);
          return `!**/**/${p}`;
        } else {
          return `**/${p}`;
        }
      })
  );
};
