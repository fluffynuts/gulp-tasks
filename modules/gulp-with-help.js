// this module attempts to make gulp able to provide help
// -> in 3.x, we can use the gulp-help package to do so
// -> in 4.x, this is shimmed in. In addition, we need to
//    - facilitate forward references, as per original gulp
//    -
var gulpInfo = require("gulp/package.json"),
  gulpVersion = parseInt(gulpInfo.version.split(".")[0], 10);

if (gulpVersion === 3) {
  module.exports = require("gulp-help")(require("gulp"));
} else {
  // NB: new deps:
  // - undertaker-forward-reference
  // - chalk
  var
    help = {};
    FwdRef = require("undertaker-forward-reference"),
    gulp = require("gulp");
  gulp.registry(new FwdRef());
  var
    originalTask = gulp.task,
    newTask = function() {
      var args = Array.from(arguments).map(a => {
        return Array.isArray(a)
          ? gulp.parallel(a)
          : a;
      });
      help[args[0]] = "";
      if (args.length < 3) {
        // not help-enabled, just pass through
        originalTask.apply(gulp, args);
        return originalTask.call(gulp, args[0]);
      } else {
        if (
          typeof args[0] === "string" &&
          typeof args[1] === "string" &&
          typeof args[2] === "function"
        ) {
          // looks like an attempt to use the old gulp-help module
          originalTask.call(gulp, args[0], args[2]);
          // because gulp couldn't just return the task :/
          var task = originalTask.call(gulp, args[0]);
          task.description = args[1];
          help[args[0]] = args[1];
          return task;
        } else {
          // ¯\_(ツ)_/¯
          return originalTask.apply(gulp, args);
        }
      }
    };
    gulp.task = newTask.bind(gulp);
    gulp.task("help", () => {
      var
        chalk = require("chalk"),
        green = chalk.greenBright.bind(chalk),
        yellow = chalk.yellowBright.bind(chalk),
        cyan = chalk.cyanBright.bind(chalk);

      return new Promise((resolve, reject) => {
        console.log(yellow("Task help"));
        var keys = Object.keys(help).sort();
        var longestKeyLength = keys.reduce(function(acc, cur) {
          return cur.length > acc ? cur.length : acc;
        }, 0);
        keys.forEach(function(key) {
          if (!help[key]) {
            return console.log(cyan(key));
          }
          var helpMessage = help[key];
          while (key.length < longestKeyLength) {
            key += " ";
          }
          console.log(cyan(key) + "  " + green(helpMessage));
        });
        resolve();
      });
    });
    module.exports = gulp;
}
