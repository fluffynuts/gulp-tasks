/*
  Welcome new user!

  To get started, copy this gulpfile.js to the root of your repo and run:
  `node gulpfile.js`
  You should be guided through the basic setup. More information in README.md. In
  particular, I highly recommend reading about how to use `local-tasks` to extend
  and / or override the default task-set.
 */

const
  path = require("path"),
  fs = require("fs");

function tryFindGulpTasks() {
  const attempts = [
      path.join(__dirname, "gulp-tasks"),
      path.join(__dirname, "..", "..", "gulp-tasks")
    ];
  for (let attempt of attempts) {
    try {
      const st = fs.statSync(attempt);
      if (st && st.isDirectory()) {
        return attempt;
      }
    } catch (e) {
      continue;
    }
  }
  throw new Error("Can't automagically find gulp-tasks folder; try defining GULP_TASKS_FOLDER env var");
}

const
  gulpTasksFolder = process.env.GULP_TASKS_FOLDER || tryFindGulpTasks(),
  requireModule = require(path.join(gulpTasksFolder, "modules", "require-module"));

if (!fs.existsSync(gulpTasksFolder)) {
  console.error("Either clone `gulp-tasks` to the `gulp-tasks` folder or modify this script to avoid sadness");
  process.exit(2);
}

let autoWorking = null;

function pauseWhilstWorking() {
  const
    args = process.argv,
    lastTwo = args.slice(args.length - 2),
    runningGulp = isGulpJs(lastTwo[0]),
    task = lastTwo[1];
  if (!runningGulp || !task) {
    return;
  }
  autoWorking = true;
  try {
    const localGulp = require("gulp");
    localGulp.task(task, function () {
      console.log(`--- taking over your ${task} task whilst we do some bootstrapping ---`);
      return new Promise(function watchWorker(resolve, reject) {
        if (!autoWorking) {
          return resolve();
        }
        setTimeout(function () {
          watchWorker(resolve, reject);
        }, 500);
      });
    });
  } catch (e) {
    /* suppress: may not have deps installed yet */
  }
}

function isGulpJs(filePath) {
  return path.basename(filePath) === "gulp.js";
}

if (!fs.existsSync("package.json")) {
  pauseWhilstWorking();
  console.log(
    "You need to set up a package.json first. I'll run `npm init` for you (:"
  );
  initializeNpm().then(() => autoWorking = false);
} else if (mustInstallDeps()) {
  pauseWhilstWorking();
  console.log(
    "Now we just need to install the dependencies required for gulp-tasks to run (:"
  );
  installGulpTaskDependencies().then(() => {
    console.log("You're good to go with `gulp-tasks`. Try running `npm run gulp build`");
    autoWorking = false;
  });
} else {
  bootstrapGulp();
}

function requiredDeps() {
  const starter = require(path.join(gulpTasksFolder, "start", "package.json"));
  return Object.keys(starter.devDependencies);
}

function mustInstallDeps() {
  if (process.env.RUNNING_AS_ZARRO) {
    // deps should be properly handled by zarro package index and initial installation
    return false;
  }
  const package = require("./package.json"),
    devDeps = package.devDependencies || {},
    haveDeps = Object.keys(devDeps),
    needDeps = requiredDeps();
  const result = needDeps.reduce((acc, cur) => {
    return acc || haveDeps.indexOf(cur) == -1;
  }, false);
  return result;
}

function initializeNpm() {
  const spawn = requireModule("spawn");
  const os = require("os");
  return runNpmWith([ "init" ])
    .then(() => {
      if (os.platform() === "win32") {
        spawn("cmd", [ "/c", "node", process.argv[1] ])
      } else {
        spawn("node", [ process.argv[1] ])
      }
    });
}

function addMissingScript(package, name, script) {
  package.scripts[name] = package.scripts[name] || script;
}

function installGulpTaskDependencies() {
  const findFirstMissing = function () {
      const args = Array.from(arguments);
      return args.reduce((acc, cur) => acc || (fs.existsSync(cur) ? acc : cur), undefined);
    },
    deps = requiredDeps(),
    package = require("./package.json"),
    buildTools = findFirstMissing("tools", "build-tools", ".tools", ".build-tools"),
    prepend = `cross-env BUILD_TOOLS_FOLDER=${buildTools}`;

  addMissingScript(package, "gulp", `${prepend} gulp`);
  addMissingScript(package, "test", "run-s \"gulp test-dotnet\"");

  fs.writeFileSync("package.json", JSON.stringify(package, null, 4), { encoding: "utf8" });
  return runNpmWith([ "install", "--save-dev" ].concat(deps));
}

function bootstrapGulp() {
  const importNpmTasks = requireModule("import-npm-tasks");
  try {
    importNpmTasks();
    const requireDir = require("require-dir");
    requireDir(gulpTasksFolder);
    [ "local-tasks", "override-tasks" ].forEach(function (dirname) {
      const fullPath = path.join(process.cwd(), dirname);
      if (fs.existsSync(fullPath)) {
        requireDir(fullPath);
      }
    });
  } catch (e) {
    if (shouldDump(e)) {
      console.error(e);
    } else {
      if (!process.env.DEBUG) {
        console.log(
          "Error occurred. For more info, set the DEBUG environment variable (eg set DEBUG=*)."
        );
      }
    }
    process.exit(1);
  }

  function shouldDump(e) {
    return process.env.ALWAYS_DUMP_GULP_ERRORS ||
      process.env.DEBUG === "*" ||
      probablyNotReportedByGulp(e);
  }

  function probablyNotReportedByGulp(e) {
    const message = (e || "").toString().toLowerCase();
    return [ "cannot find module", "referenceerror", "syntaxerror" ].reduce(
      (acc, cur) => {
        return acc || message.indexOf(cur) > -1;
      },
      false
    );
  }
}

function runNpmWith(args) {
  const spawn = requireModule("spawn");
  const os = require("os");

  return os.platform() === "win32"
    ? spawn("cmd", [ "/c", "npm" ].concat(args))
    : spawn("npm", args);
}
