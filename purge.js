'use strict'
const gulp = requireModule('gulp-with-help'),
    path = require('path'),
    del = require('del'),
    rimraf = require('rimraf'),
    findDirs = requireModule('find-dirs'),
    debug = require('debug')('purge');

function isNotInRootDir(dir) {
  // where 'root dir' refers to the gulp context current dir
  var inRootDir = path.resolve(path.basename(dir));
  return inRootDir !== dir;
}

function doRegularRm(dir, inRootToo) {
  return new Promise((resolve, reject) => {
    try {
      debug(`searching for folders matching: ${dir}`);
      var matches = findDirs('.', dir);
      debug(`got: ${matches}`);
      if (!inRootToo) {
        matches = matches.filter(isNotInRootDir);
      }
      if (matches.length === 0) {
        debug(`-> nothing to do for ${dir}`);
        return resolve();
      }
      matches.forEach(f => {
        debug(`should purge: ${f}`);
        rimraf.sync(f);
        debug(`purge complete: ${f}`);
      });
      resolve();
    } catch (e) {
      debug(`whoops! ${e}`);
      reject(e);
    }
  });
}

function doPurge(includeRootFolders) {
  return Promise.all([
    del([
      './source/**/bin/**',
      './src/**/bin/**',
      './source/**/obj/**',
      './src/**/obj/**'
    ]),
    doRegularRm('node_modules', includeRootFolders),
    doRegularRm('bower_components', includeRootFolders),
    doRegularRm('packages', includeRootFolders)
  ]).then(() => {
    debug('-- PURGE COMPLETE! ---');
  });
}

gulp.task('purge',
    'Purges all bins, objs, node_modules, bower_components and packages not in the root',
    function () {
    return doPurge(false);
});

gulp.task('mega-purge',
  'Performs regular purge and in the root (you\'ll have to `npm install` afterwards!',
  function() {
  return doPurge(true);
});

