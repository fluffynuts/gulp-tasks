(function() {
  module.exports = function uniq<T>(values: T[]): T[] {
      return Array.from(new Set(values));
  }
})();
