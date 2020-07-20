const spawn = requireModule("spawn"),
  gulp = requireModule("gulp"),
  log = requireModule("log"),
  fs = requireModule("fs"),
  subModulesFile = ".gitmodules";

gulp.task('git-submodules', 'Updates (with --init) all submodules in tree', function () {
  return spawn('git', ['submodule', 'update', '--init', '--recursive']);
});

gulp.task('git-submodules-as-externals', function () {
  return new Promise((resolve, reject) => {
  if (!fs.existsSync(subModulesFile)) {
    log.notice('no submodules file found');
    return resolve();
  } else {
    log.notice('performing submodule init/update...');
    spawn('git', ['submodule', 'update', '--init', '--recursive']).then(function () {
      log.info('getting list of local submodules...');
      return fs.readFile(subModulesFile);
    }).then(function (buffer) {
      log.info('grokking paths of local submodules...');
      const fileContents = buffer.toString();
      const lines = fileContents.split("\n");
      const submodulePaths = lines.reduce(function (acc, cur) {
        const parts = cur.split(" = ").map(function (item) {
          return item.trim();
        });
        if (parts.length > 1 && parts[0] === "path") {
          acc.push(parts[1]);
        }
        return acc;
      }, []);
      return submodulePaths;
    }).then(function (modulePaths) {
      const mkdir = function (path) {
        const parts = path.split("/");
        let current = "";
        parts.forEach(function (part) {
          current += current ? "/" : "";
          current += part;
          if (!fs.existsSync(current)) {
            fs.mkdirSync(current);
          }
        });
      };
      modulePaths.forEach(function (path) {
        mkdir(path);
      });
      return modulePaths;
    }).then(function (modulePaths) {
      log.info('making sure local submodules are up to date...');
      const innerDeferred = q.defer();
      const spawnOptions = {
        stdio: [ process.stdin, process.stdout, process.stderr, "pipe" ]
      };
      const finalPromise = modulePaths.reduce(function (acc, cur) {
        const workingFolder = [ process.cwd(), cur ].join("/");
        log.info("working with submodule at: " + cur);
        spawnOptions.cwd = workingFolder;
        return acc.then(function () {
          log.debug(" - fetch changes");
          return spawn("git", [ "fetch" ], spawnOptions).then(function () {
            log.debug(" - switch to master");
            return spawn("git", [ "checkout", "master" ], spawnOptions);
          }).then(function () {
            log.debug(" - fast-forward to HEAD");
            return spawn("git", [ "rebase" ], spawnOptions);
          });
        });
      }, innerDeferred.promise);
      innerDeferred.resolve();
      return finalPromise;
    }).then(function () {
      log.info('git submodule magick complete');
      resolve();
    }).catch(function (err) {
      reject(err);
    });
  }
  });
});

