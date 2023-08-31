(function() {
  module.exports = async function runInParallel(
    maxConcurrency: number,
    ...actions: AsyncVoidVoid[]
  ): Promise<void> {
    const toRun = [ ...actions ];
    const batch = toRun.splice(0, maxConcurrency)
      .map(a => {
        return a().then(() => {
          const n = next();
          return n();
        });
      });
    await Promise.all(batch);

    function next(): AsyncVoidVoid {
      const result = toRun.shift();
      if (result) {
        return () => result().then(next());
      }
      return noop;
    }
  }

  function noop(): Promise<void> {
    return Promise.resolve();
  }
})();
