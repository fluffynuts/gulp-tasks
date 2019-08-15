/*
  Welcome new user!

  To get started, copy this gulpfile.js to the root of your repo and run:
  `node gulpfile.js`
  You should be guided through the basic setup. More information in README.md. In
  particular, I highly recommend reading about how to use `local-tasks` to extend
  and / or override the default task-set.
 */
var fs = require("fs"),
  gulpTasksFolder = "gulp-tasks", // if you cloned elsewhere, you"ll need to modify this
  requireModule = global.requireModule = function(mod) {
    var modulePath = [".", gulpTasksFolder, "modules", mod].join("/");
    if (fs.existsSync(modulePath + ".js")) {
        return require(modulePath);
    } else {
        return require(mod);
    }
  };


if (!fs.existsSync(gulpTasksFolder)) {
  console.error("Either clone `gulp-tasks` to the `gulp-tasks` folder or modify this script to avoid sadness");
  process.exit(2);
}

if (!fs.existsSync("package.json")) {
  console.log(
    "You need to set up a package.json first. I'll run `npm init` for you (:"
  );
  initializeNpm();
} else if (mustInstallDeps()) {
  console.log(
    "Now we just need to install the dependencies required for gulp-tasks to run (:"
  );
  installGulpTaskDependencies().then(() =>
    console.log("You're good to go with `gulp-tasks`. Try running `npm run gulp build`")
  );
} else {
  bootstrapGulp();
}

function requiredDeps() {
    var starter = require([".", gulpTasksFolder, "start", "package.json"].join("/"));
    return Object.keys(starter.devDependencies);
}

function mustInstallDeps() {
  var
    package = require("./package.json"),
    devDeps = package.devDependencies || {},
    haveDeps = Object.keys(devDeps),
    needDeps = requiredDeps();
  return needDeps.reduce((acc, cur) => {
    return acc || haveDeps.indexOf(cur) == -1;
  }, false);
}

function initializeNpm() {
  var spawn = requireModule("spawn");
  runNpmWith(["init"])
  .then(() => spawn("cmd", [ "/c", "node", process.argv[1]]));
}

function addMissingScript(package, name, script) {
    package.scripts[name] = package.scripts[name] || script;
}

function installGulpTaskDependencies() {
  var
    findFirstMissing = function() {
      var args = Array.from(arguments);
      return args.reduce((acc, cur) => acc || (fs.existsSync(cur) ? acc : cur), undefined);
    },
    deps = requiredDeps(),
    package = require("./package.json"),
    buildTools = findFirstMissing("tools", "build-tools", ".tools", ".build-tools"),
    prepend = `cross-env BUILD_TOOLS_FOLDER=${buildTools}`;

  addMissingScript(package, "gulp", `${prepend} gulp`);
  addMissingScript(package, "test", "run-s \"gulp test-dotnet\"");

  fs.writeFileSync("package.json", JSON.stringify(package, null, 4), { encoding: "utf8" });

  return runNpmWith(["install", "--save-dev"].concat(deps));
}

function bootstrapGulp() {
  var importNpmTasks = requireModule("import-npm-tasks");
  try {
    importNpmTasks();
    var requireDir = require("require-dir");
    requireDir("gulp-tasks");
    ["override-tasks", "local-tasks"].forEach(function(dirname) {
      if (fs.existsSync(dirname)) {
        requireDir(dirname);
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
    return process.env.ALWAYS_DUMP_GULP_ERRORS || probablyNotReportedByGulp(e);
  }

  function probablyNotReportedByGulp(e) {
    var message = (e || "").toString().toLowerCase();
    return ["cannot find module", "referenceerror", "syntaxerror"].reduce(
      (acc, cur) => {
        return acc || message.indexOf(cur) > -1;
      },
      false
    );
  }
}

function runNpmWith(args) {
  var spawn = requireModule("spawn");
  return spawn("cmd", ["/c", "npm"].concat(args));
}
