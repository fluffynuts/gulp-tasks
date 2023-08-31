(function () {
  module.exports = function fallback(...args: any[]) {
    return args.reduce((acc, cur) => {
      return acc === undefined ? cur : acc;
    });
  };
})();
