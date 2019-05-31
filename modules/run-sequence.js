var gulpVersion = requireModule("gulp-version");
if (gulpVersion.major === 3) {
  module.exports = require("run-sequence");
} else {
  var setTaskName = requireModule("set-task-name");
  // it's shim time, baby!
  const gulp = requireModule("gulp-with-help");
  module.exports = function() {
    const
      args = Array.from(arguments),
      callback = args.pop(),
      composite = gulp.series.apply(gulp, args);
    setTaskName(composite, "(sequence)");
    composite(callback);
  };
}
