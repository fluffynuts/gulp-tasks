const { ZarroError } = requireModule("zarro-error");

module.exports = function pad(str, len, isRight, padString) {
  if (isRight === undefined) {
    // default to right-padding
    isRight = true;
  }
  if (str === undefined) {
    throw new ZarroError("padRight needs a string!");
  }
  if (len === undefined) {
    throw new ZarroError("padRight needs a length!");
  }
  const requiredChars = len - str.length;
  if (requiredChars < 1) {
    return str;
  }
  padString = padString || " ";
  const
    required = Math.ceil(requiredChars / padString.length),
    toAdd = padString.repeat(required).slice(0, requiredChars);
  return isRight
    ? str + toAdd
    : toAdd + str;
};
