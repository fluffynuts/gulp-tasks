module.exports = function pad(str, len, isRight) {
  if (isRight === undefined) {
    // default to right-padding
    isRight = true;
  }
  if (str === undefined) {
    throw new Error("padRight needs a string!");
  }
  if (len === undefined) {
    throw new Error("padRight needs a length!");
  }
  const requiredChars = len - str.length;
  if (requiredChars < 1) {
    return str;
  }
  const toAdd = " ".repeat(requiredChars);
  return isRight
    ? str + toAdd
    : toAdd + str;
}
