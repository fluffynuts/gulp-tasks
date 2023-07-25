(function () {
  module.exports = function setTaskName(
    task: any,
    name: string
  ) {
    task.displayName = name;
    Object.defineProperty(task, "name", {
      get() {
        return name;
      }
    });
    return task;
  };
})();
