var exec = require('child_process').execSync,
  fs = require('fs');

module.exports = function(path) {
  console.log('verifying executable at: ', path);
  return new Promise(function(resolve, reject) {
    try {
      exec(path);
      resolve();
    } catch (ignore) {
      console.error('-> executable is bad )\': (imma delete it!)');
      console.info('Suggestion: add a nuget.exe binary to the folder hosting your gulp-tasks');
      fs.unlinkSync(path);
      reject();
    }
  })
}