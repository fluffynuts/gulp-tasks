const
  fallback = require("./fallback"),
  padRight = require("./pad-right");

function makeHelpString(stringOrObject) {
  if (typeof(stringOrObject === "string")) {
    return stringOrObject;
  }
  let msg, defaultValue;
  if (Array.isArray(stringOrObject)) {
    msg = stringOrObject[0];
    defaultValue = stringOrObject[1];
  } else {
    msg = fallback(stringOrObject.message, stringOrObject.msg);
    defaultValue = fallback(stringOrObject.defaultValue, stringOrObject.default);
  }
  return `${msg} (default: ${defaultValue})`;
}

module.exports = function generateEnvHelpFor(dict) {
  const
    keys = Object.keys(dict),
    longest = keys.reduce((acc, cur) => cur.length > acc ? cur.length : acc);

  return [
    "\tObserved environment variables:"
  ].concat(Object.keys(dict).map(k =>
    `${padRight(k, longest)}  ${makeHelpString(dict[k])}`
  )).join("\n\t\t");
}
