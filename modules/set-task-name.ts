(function () {
  const
    ZarroError = requireModule<ZarroError>("zarro-error");
  module.exports = function setTaskName(
    task: any,
    name: string
  ) {
    if (!task) {
      throw new ZarroError(`task not provided`);
    }
    if (!name) {
      throw new ZarroError(`task name not provided`);
    }
    task.displayName = name;
    task.label = name;
    Object.defineProperty(task, "name", {
      get() {
        return name;
      }
    });
    return task;
  };
})();
