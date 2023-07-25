(function() {
  const runSequence = requireModule<RunSequence>("run-sequence");
  async function runTask(task: string): Promise<void> {
    return new Promise(resolve => {
      runSequence(task, resolve);
    });
  }
  module.exports = {
    runTask
  };
})();
