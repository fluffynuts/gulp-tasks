const
  chalk = require("chalk"),
  registeredEnvironmentVariables = {},
  longestStringLength = require("./longest-string-length"),
  padRight = require("./pad-right"),
  padLeft = require("./pad-left");

const positives = [
  "1",
  "yes",
  "true"
];
if (process.env.POSITIVE_FLAG) {
  positives.push(process.env.POSITIVE_FLAG);
}

function flag(name, defaultValue) {
  const
    envVar = fallback(name, defaultValue);

  return envVar === true ||
    positives.indexOf((envVar || "").toLowerCase()) > -1;
}

function fallback(name, defaultValue) {
  const envVar = process.env[name];
  return envVar === undefined ? defaultValue : envVar;
}

function register(config) {
  let { name, help, tasks } = config;
  // 'default' seems like a more natural name, but we can't use it for a var name...
  let fallback = config.default;
  if (registeredEnvironmentVariables[name]) {
    return update(name, fallback, help, tasks);
  }
  tasks = normaliseArray(tasks);
  help = trim(help);
  fallback = trim(fallback);

  registeredEnvironmentVariables[name] = {
    help,
    tasks,
    default: fallback,
  }
}

function normaliseArray(arr) {
  if (!arr) {
    return [];
  }
  return Array.isArray(arr)
    ? arr
    : [ arr ];
}

function update(varName, fallbackValue, help, tasks) {
  const target = registeredEnvironmentVariables[varName];
  if (!target.help) {
    target.help = trim(help);
  }
  if (!target.default) {
    target.default = trim(fallbackValue);
  }
  tasks = normaliseArray(tasks);
  target.tasks = target.tasks.concat(tasks);
}

function trim(str) {
  return (str || "").trim();
}

function printHelp() {
  printHelpFor(listVars());
}

function printHelpFor(vars) {
  const longest = longestStringLength(vars);
  vars.forEach(k =>
    createHelpFor(k, longest)
      .forEach(line => console.log(line))
  );
}

function indent(str, howMany) {
  if (howMany === undefined || howMany < 1) {
    howMany = 1;
  }
  return padLeft(str, howMany * 2 + str.length);
}

function createHelpFor(k, longest) {
  if (longest === undefined) {
    // take a guess
    longest = 16;
  }
  const result = [];
  result.push(chalk.yellow(`${padRight(k, longest)}`));
  const target = registeredEnvironmentVariables[k];
  if (target.help) {
    result.push(indent(target.help));
  }
  if (target.default) {
    result.push(indent(`default: ${target.default}`, 2));
  }
  if (target.tasks && target.tasks.length) {
    result.push(indent(`tasks: ${target.tasks.map(t => t.trim()).filter(t => t).join(", ")}`, 2))
  }
  return result;
}

function listVars() {
  return Object.keys(registeredEnvironmentVariables).sort();
}

function taskHelp(task) {
  const
    keys = listVars(),
    matchingRequest = keys.filter(
      cur => {
        return registeredEnvironmentVariables[cur].tasks.indexOf(task) > -1
      });
  printHelpFor(matchingRequest);
}

function resolve(name) {
  const target = registeredEnvironmentVariables[name] || {};
  return process.env[name] || target.default;
}

module.exports = {
  flag,
  fallback,
  register,
  printHelp,
  taskHelp,
  resolve
};
