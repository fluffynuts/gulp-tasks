(function() {
  module.exports = async function safeGit<T>(
    runGit: (() => Promise<T>),
    defaultValue?: T
  ): Promise<T | undefined> {
    const errorFn = console.error;
    // hack: make console.error a no-op: we're handling errors
    // inline and I don't see a way (apart from altering node_env)
    // to suppress logging
    console.error = () => {};
    try {
      return await runGit();
    } catch (ex) {
      const
        e = ex as Error,
        message = e.message || e.toString();
      if (message.match(/not a git repository/i)) {
        return defaultValue;
      }
      throw e;
    } finally {
      console.error = errorFn;
    }
  }
})();
