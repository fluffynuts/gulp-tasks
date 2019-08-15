module.exports = function fallback() {
  const args = Array.from(arguments);
  return args.reduce((acc, cur) => {
    return acc === undefined ? cur : acc;
  });
}
