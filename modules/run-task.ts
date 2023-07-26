(function() {
  const runSequence = requireModule<RunSequence>("run-sequence");
  async function runTask(task: string): Promise<void> {
    return new Promise(resolve => {
      runSequence(task, resolve);
    });
  }
  async function runSeries(...tasks: string[]): Promise<void> {
    for (const task of tasks) {
      await runTask(task);
    }
  }
  async function runParallel(...tasks: string[]): Promise<void> {
    const promises = tasks.map(t => runTask(t));
    await Promise.all(promises);
  }

  module.exports = {
    runTask,
    runSeries,
    runParallel
  };
})();
