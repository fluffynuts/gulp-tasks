(function () {
  module.exports = function (obj: any) {
    if (!obj) {
      return false;
    }
    if (obj instanceof Promise) {
      return true;
    }
    return typeof obj === "object" &&
      obj.then &&
      typeof obj.then === "function";
  };
})();
