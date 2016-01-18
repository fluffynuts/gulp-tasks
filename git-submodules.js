var spawn = require('./modules/spawn');
var gulp = require('gulp');
var log = require('./modules/log');
var fs = require('fs');
var q = require('q');
var readFile = q.denodeify(fs.readFile);
var subModulesFile = '.gitmodules';

gulp.task('git-submodules', function() {
    return spawn('git', ['submodule', 'update', '--init', '--recursive']);
});

gulp.task('git-submodules-as-externals', function() {
    var deferred = q.defer();
    if (!fs.existsSync(subModulesFile)) {
        log.notice('no submodules file found');
        deferred.resolve();
    } else {
        log.notice('performing submodule init/update...');
        spawn('git', ['submodule', 'update', '--init', '--recursive']).then(function() {
            log.info('getting list of local submodules...');
            return readFile(subModulesFile);
        }).then(function(buffer) {
            log.info('grokking paths of local submodules...');
            var fileContents = buffer.toString();
            var lines = fileContents.split('\n');
            var submodulePaths = lines.reduce(function(acc, cur) {
                var parts = cur.split(' = ').map(function(item) {
                    return item.trim();
                });
                if (parts.length > 1 && parts[0] === 'path') {
                    acc.push(parts[1]);
                }
                return acc;
            }, []);
            return submodulePaths;
        }).then(function(modulePaths) {
            var mkdir = function(path) {
                var parts = path.split('/');
                var current = '';
                parts.forEach(function(part) {
                    current += current ? '/' : '';
                    current += part;
                    if (!fs.existsSync(current)) {
                        fs.mkdirSync(current);
                    }
                });
            };
            modulePaths.forEach(function(path) {
                mkdir(path);
            });
            return modulePaths;
        }).then(function(modulePaths) {
            log.info('making sure local submodules are up to date...');
            var innerDeferred = q.defer();
            var spawnOptions = {
                stdio: [process.stdin, process.stdout, process.stderr, 'pipe']
            };
            var finalPromise = modulePaths.reduce(function(acc, cur) {
                var workingFolder = [process.cwd(), cur].join('/');
                log.info('working with submodule at: ' + cur);
                spawnOptions.cwd = workingFolder;
                return acc.then(function() {
                    log.debug(' - fetch changes');
                    return spawn('git', ['fetch'], spawnOptions).then(function() {
                        log.debug(' - switch to master');
                        return spawn('git', ['checkout', 'master'], spawnOptions);
                    }).then(function() {
                        log.debug(' - fast-forward to HEAD');
                        return spawn('git', ['rebase'], spawnOptions);
                    }); 
                });
            }, innerDeferred.promise);
            innerDeferred.resolve();
            return finalPromise;
        }).then(function() {
            log.info('git submodule magick complete');
            deferred.resolve();
        }).catch(function(err) {
            deferred.reject(err);
        });
    }
    return deferred.promise;
});

