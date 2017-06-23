const
  gulp = requireModule("gulp-with-help"),
  taskName = "test-task-hooks",
  generateTaskHooks = requireModule("generate-task-hooks");

gulp.task(taskName, () => {
  console.log(` == ${taskName} original logic ==`);
  Promise.resolve();
});

generateTaskHooks("moocakes");

// prove that you can override them after generation
gulp.task(`post::${taskName}`, () => {
  console.log(`running local post::${taskName} hook task`);
  return Promise.resolve();
});

gulp.task(`pre::${taskName}`, () => {
  console.log(`running local pre::${taskName} hook task`);
});