module.exports = function longestStringLength(arr) {
  if (!arr) {
    arr = "";
  }
  if (!Array.isArray(arr)) {
    arr = [arr];
  }
  return arr.reduce(
    (acc, cur) => {
      const currentLength = ((cur || "").toString()).length;
      return acc > currentLength ? acc : currentLength;
    }, 0);
}
