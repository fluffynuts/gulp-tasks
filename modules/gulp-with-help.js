// this module attempts to make gulp able to provide help
// -> in 3.x, we can use the gulp-help package to do so
// -> in 4.x, this is shimmed in. In addition, we need to
//    - facilitate forward references, as per original gulp
//    -
var gulpInfo = require("gulp/package.json"),
  gulpVersion = requireModule("gulp-version");

if (gulpVersion.major === 3) {
  module.exports = require("gulp-help")(require("gulp"));
} else {
  function setTaskName(task, name) {
    task.displayName = name;
    Object.defineProperty(task, "name", {
      get() {
        return name;
      }
    });
  }
  // NB: new deps:
  // - undertaker-forward-reference
  // - chalk
  var help = {};
  (FwdRef = require("undertaker-forward-reference")), (gulp = require("gulp"));
  gulp.registry(new FwdRef());
  var originalTask = gulp.task,
    newTask = function() {
      let
        args = Array.from(arguments),
        taskName = args[0],
        helpMessage = "";
      if (typeof args[1] === "string") {
        helpMessage = args[1];
        args.splice(1, 1);
      }
      if (Array.isArray(args[1])) {
        const parallel = gulp.parallel(args[1]);
        setTaskName(parallel, `pre-${taskName}`);
        args[1] = gulp.series(
          parallel,
          args[2] || (() => Promise.resolve())
        );
        setTaskName(args[1], `[${taskName}]`);
        args.splice(2, 1);
      }
      help[taskName] = helpMessage;
      originalTask.call(gulp, taskName, args[1]);
      const generatedTask = originalTask.call(gulp, taskName);
      generatedTask.description = helpMessage;
      return generatedTask;
    };
  gulp.task = newTask.bind(gulp);
  gulp.task("help", () => {
    var chalk = require("chalk"),
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
