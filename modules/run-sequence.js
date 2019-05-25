var gulpVersion = requireModule("gulp-version");
if (gulpVersion.major === 3) {
  module.exports = require("run-sequence");
} else {
  // it's shim time, baby!
  const gulp = requireModule("gulp-with-help");
  module.exports = function() {
    const
      args = Array.from(arguments),
      callback = args.pop(),
      composite = gulp.series.apply(gulp, args);
    composite(callback);
  };
}
