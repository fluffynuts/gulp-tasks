module.exports = function padRight(str, len) {
  const requiredChars = len - str.length;
  if (requiredChars < 1) {
    return str;
  }
  const append = " ".repeat(requiredChars);
  return str + append;
}
