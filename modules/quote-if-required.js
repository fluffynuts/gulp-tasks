function isAlreadyQuoted(str) {
  return str &&
    str[0] === "\"" &&
    str[str.length-1] === "\"";
}

module.exports = function quoteIfRequired(arg) {
  return arg.indexOf(" ") > -1 &&
    arg.match(/^".*"$/) == null
    ? isAlreadyQuoted(arg) ? arg : `"${arg}"`
    : arg;
}

