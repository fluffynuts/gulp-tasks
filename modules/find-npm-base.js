const 
  path = require("path"),
  fs = requireModule("fs");
let cached;

function findClosestPackageJsonFolder() {
  let current = __dirname;
  while (!hasPackageJson(current)) {
    const next = path.dirname(current);
    if (next === current) {
      throw new Error(`Can't find a package.json, traversing up from ${__dirname}`);
    }
    current = next;
  }
  return current;
}

function hasPackageJson(folder) {
  const test = path.join(folder, "package.json");
  if (!fs.existsSync(test)) {
    return false;
  }
  try {
    const 
      contents = require(test),
      repo = contents.repository || {},
      url = repo.url || "",
      isGulpTasks = url.match(/\/fluffynuts\/gulp-tasks$/);
    return !isGulpTasks;  
  } catch (ignore) {
    return false;
  }
}

module.exports = function() {
  return cached || (cached = findClosestPackageJsonFolder());
};