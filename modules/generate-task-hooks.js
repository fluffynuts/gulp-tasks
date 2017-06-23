const
  gulp = requireModule("gulp-with-help")
  debug = require("debug")("task-hook-generator"),
  noop = function() { },
  runSequence = require("run-sequence");

function generateEventTaskShell(ev, taskName) {
  const newTaskName = `${ev}::${taskName}`;
  if (!gulp.task[newTaskName]) {
    gulp.task(newTaskName, noop);
  } else {
    console.warn(`Already have a shell task for ${newTaskName}`);
  }
  return newTaskName;
}

function isEmptyTask(taskName) {
  const task = gulp.tasks[taskName];
  return !task || task.fn === noop;
}

function makeArgs(pre, actual, post, cb) {
  const 
    preIsEmpty = isEmptyTask(pre),
    postIsEmpty = isEmptyTask(post),
    result = [ actual ];
  if (!preIsEmpty) {
    result.unshift(pre);
  }
  if (!postIsEmpty) {
    result.push(post);
  }
  result.push(cb);
  return result;
}

function hijackTaskWithEvents(taskName) {
  try {
    const
      wrapper = `wrapper::${taskName}`,
      original = `${taskName} (original)`,
      preEventTaskName = generateEventTaskShell("pre", taskName),
      postEventTaskName = generateEventTaskShell("post", taskName),
      task = gulp.tasks[taskName];
    if (!task) {
      return;
    }

    gulp.tasks[original] = gulp.tasks[taskName];
    gulp.tasks[original].name = original;

    gulp.task(taskName, () => {
      const args = makeArgs(preEventTaskName, original, postEventTaskName, err => {
        return new Promise((resolve, reject) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      runSequence.apply(null, args);
    });
  } catch (e) {
    console.log("hijack fails", e);
  }
}

module.exports = function (taskName) {
  const task = gulp.tasks[taskName];
  if (task) {
    hijackTaskWithEvents(taskName);
  }
}