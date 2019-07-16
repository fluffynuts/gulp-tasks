module.exports = function pathQuote(str) {
  if (!str) {
    return str;
  }
  if (str.indexOf(" ") === -1) {
    return str;
  }
  if (str[0] == "\"" &&
      str[str.length - 1] == "\"") {
    return str;
  }
  return `"${str}"`;
}
