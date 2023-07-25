(function () {
  const gulpVersion = requireModule<GulpVersion>("gulp-version");
  if (gulpVersion.major === 3) {
    module.exports = require("run-sequence");
  } else {
    const setTaskName = requireModule<SetTaskName>("set-task-name");
    // it's shim time, baby!
    const gulp = requireModule<Gulp>("gulp");
    module.exports = function () {
      const
        args = Array.from(arguments),
        callback = args.pop() as Function,
        composite = gulp.series.apply(gulp, args as string[]);
      setTaskName(composite, "(sequence)");
      composite(callback);
    };
  }
})();
