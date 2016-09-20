var child_process = require('child_process'),
    which = require('which'),
    fs = require('fs');

function runNpmScript(target, folder, resolve, reject) {
  var start = target === 'install' ? [] : ['run'];
  var proc = child_process.spawn(which.sync('npm'), start.concat(target), {
    cwd: folder,
    stdio: 'inherit'
  });
  proc.on('close', function(code) {
    if (code) {
      reject(code);
    }
    resolve(code);
  });
}

module.exports = function(target, folder) {
  return new Promise(function(resolve, reject) {
    if (!folder) {
      folder = '.';
    }
    if (!fs.existsSync(folder) && fs.existsSync(target)) {
      var swap = target;
      target = folder;
      folder = swap;
    }
    if (!fs.existsSync(folder)) {
      reject('Unable to run npm script: folder not found: "' + folder + '"');
    }
    return runNpmScript(target, folder, resolve, reject);
  });
}
