if (!Array.prototype.flatMap) {
  try {
    const flatMap = require("array.prototype.flatmap");
    flatMap.shim();
  } catch (e) {
    console.error(
      "Array.prototype.flatmap is required -- either use a newer Node or install the npm package array.prototype.flatmap"
    );
  }
}
const
  chalk = require("ansi-colors"),
  debug = require("debug")("env"),
  registeredEnvironmentVariables = {},
  longestStringLength = require("./longest-string-length"),
  padRight = require("./pad-right"),
  padLeft = require("./pad-left"),
  toExport = {
    flag,
    fallback,
    register,
    printHelp,
    taskHelp,
    resolve,
    associate,
    resolveArray,
    explode,
    overrideDefault,
    resolveNumber,
    resolveFlag
  };

const positives = [ "1", "yes", "true" ];
if (process.env.POSITIVE_FLAG) {
  positives.push(process.env.POSITIVE_FLAG);
}

function flag(name, defaultValue) {
  const envVar = fallback(name, defaultValue);

  return (
    envVar === true || positives.indexOf((envVar || "").toLowerCase()) > -1
  );
}

function fallback(name, defaultValue) {
  const envVar = process.env[name];
  return envVar === undefined ? defaultValue : envVar;
}

function register(config) {
  let { name, help, tasks, overriddenBy, when } = config;
  if (toExport[name] !== undefined) {
    throw new Error(`env var already registered: ${name}`);
  }
  toExport[name] = name;
  // 'default' seems like a more natural name, but we can't use it for a var name...
  let fallback = config.default;
  if (registeredEnvironmentVariables[name]) {
    return update(name, fallback, help, tasks, overriddenBy, when);
  }
  tasks = normaliseArray(tasks);
  help = trim(help);
  fallback = trim(fallback);

  registeredEnvironmentVariables[name] = {
    help,
    tasks,
    default: fallback,
    overriddenBy: overriddenBy || [],
    when
  };
  if (pendingAssociations[name]) {
    const otherTasks = pendingAssociations[name];
    delete pendingAssociations[name];
    tasks.push.apply(tasks, otherTasks);
  }
  if (pendingDefaultOverrides[name]) {
    registeredEnvironmentVariables[name].default =
      pendingDefaultOverrides[name];
    delete pendingDefaultOverrides[name];
  }
  debug({
    label: `register env var: ${name}`,
    config: registeredEnvironmentVariables[name]
  });
  return toExport;
}

const pendingAssociations = {};

function associate(varName, tasks) {
  if (Array.isArray(varName)) {
    varName.forEach(v => associate(v, tasks));
    return toExport;
  }

  if (!varName || !tasks || tasks.length === 0) {
    return toExport;
  }
  if (!Array.isArray(tasks)) {
    tasks = [ tasks ];
  }

  const target = registeredEnvironmentVariables[varName]
    ? registeredEnvironmentVariables[varName].tasks
    : (pendingAssociations[varName] = pendingAssociations[varName] || []);
  tasks.forEach(task => {
    if (target.indexOf(task) > -1) {
      return;
    }
    target.push(task);
  });
  return toExport;
}

const pendingDefaultOverrides = {};

function overrideDefault(varName, newDefault) {
  const target = registeredEnvironmentVariables[varName];
  if (target) {
    target.default = newDefault;
  } else {
    pendingDefaultOverrides[varName] = newDefault;
  }
}

function normaliseArray(arr) {
  if (!arr) {
    return [];
  }
  return Array.isArray(arr) ? arr : [ arr ];
}

function update(varName, fallbackValue, help, tasks, overriddenBy, when) {
  const target = registeredEnvironmentVariables[varName];
  if (!target.help) {
    target.help = trim(help);
  }
  if (!target.default) {
    target.default = trim(fallbackValue);
  }
  tasks = normaliseArray(tasks);
  target.tasks = target.tasks.concat(tasks);
  target.overriddenBy = target.overriddenBy.concat(overriddenBy || []);
  // TODO: composite when? this code is first-come-first-wins
  target.when = target.when || when;
  debug({
    label: `update env var: ${varName}`,
    config: target
  });
  return toExport;
}

function trim(str) {
  if (str === null || str === undefined) {
    return "";
  }
  if (Array.isArray(str)) {
    return str.map(s => s.trim());
  }
  return str.toString().trim();
}

function printHelp() {
  printHelpFor(listVars());
}

function printHelpFor(vars) {
  const longest = longestStringLength(vars);
  vars.forEach(k =>
    createHelpFor(k, longest).forEach(line => console.log(line))
  );
}

function indent(str, howMany) {
  if (howMany === undefined || howMany < 1) {
    howMany = 1;
  }
  return padLeft(str, howMany * 2 + str.length);
}

const tasksPre = chalk.greenBright("tasks"),
  defaultPre = chalk.cyanBright("default");

function createHelpFor(k, longest) {
  if (longest === undefined) {
    // take a guess
    longest = 16;
  }
  const result = [];
  result.push(chalk.yellow(`${padRight(k, longest)}`));
  const target = registeredEnvironmentVariables[k];
  if (target.help) {
    result.push(indent(chalk.gray(target.help)));
  }
  if (target.default) {
    result.push(indent(`${defaultPre}: ${target.default}`, 2));
  }
  if (target.tasks && target.tasks.length) {
    result.push(
      indent(
        `${tasksPre}: ${target.tasks
          .map(t => t.trim())
          .filter(t => t)
          .sort()
          .join(", ")}`,
        2
      )
    );
  }
  if (target.overriddenBy !== undefined) {
    const overrides = Array.isArray(target.overriddenBy)
      ? target.overriddenBy.join(",")
      : target.overriddenBy;
    if (overrides.trim()) {
      result.push(indent(chalk.magenta(`overridden by: ${overrides}`)));
    }
  }
  return result;
}

function listVars() {
  return Object.keys(registeredEnvironmentVariables).sort();
}

function taskHelp(task) {
  const keys = listVars(),
    matchingRequest = keys.filter(cur => {
      return registeredEnvironmentVariables[cur].tasks.indexOf(task) > -1;
    });
  printHelpFor(matchingRequest);
}

function resolve() {
  const names = Array.from(arguments).flatMap(a => a);
  const result = resolveInternal(names);
  logResolved(names, result);
  return result;
}

function resolveFirst(names, ignoreDefault) {
  return names
    .reduce((acc, cur) =>
      acc === undefined
        ? resolveInternal(cur, ignoreDefault)
        : acc, undefined);
}

function resolveInternal(name, ignoreDefault) {
  if (Array.isArray(name)) {
    // attempt to resolve the first defined variable
    const firstDefined = resolveFirst(name, true);
    // if that doesn't work, get the first default value
    return firstDefined === undefined
      ? resolveFirst(name, false)
      : firstDefined;
  }

  const target = registeredEnvironmentVariables[name] || {},
    configuredOverrides = target.overriddenBy,
    overrides = configuredOverrides
      ? Array.isArray(configuredOverrides)
        ? configuredOverrides
        : [ configuredOverrides ]
      : [],
    overrideValues = overrides
      .map(s => process.env[s])
      .filter(s => s !== undefined),
    initialValue =
      (!ignoreDefault && process.env[name] === undefined) ? target.default : process.env[name];
  if (overrideValues.length === 0) {
    return initialValue;
  }
  if (target.when === undefined) {
    if (overrideValues.length > 0) {
      console.warn(
        `multiple override values found for '${name}' and no strategy for discriminating set; selecting the first`
      );
      debug({
        when: target.when,
        overrides,
        overrideValues,
        initialValue
      });
    }
    return overrideValues[0];
  }

  const result = overrideValues.reduce((acc, cur) => {
    debug({
      label: "invoke override discriminator",
      when: target.when,
      acc,
      cur
    });
    return target.when(acc, cur) ? cur : acc;
  }, initialValue);

  debug({
    when: target.when,
    overrides,
    overrideValues,
    initialValue,
    envVar: name,
    envValue: process.env[name],
  });

  return result;
}

function logResolved(name, value) {
  debug(`resolved: ${name} => ${quoteString(value)}`);
}

function quoteString(val) {
  return typeof val === "string" ? `"${val}"` : val;
}

function resolveArray(name, delimiter) {
  const value = resolveInternal(name) || "",
    valueArray = Array.isArray(value) ? value : explode(value, delimiter);
  logResolved(name, valueArray);
  return valueArray;
}

function resolveNumber(name) {
  const value = resolveInternal(name),
    asNumber = parseInt(value, 10);
  if (isNaN(asNumber)) {
    throw new Error(`${value} is not a valid numeric value for ${name}`);
  }
  logResolved(name, asNumber);
  return asNumber;
}

const positiveFlags = [ "yes", "true", "1" ];
const negativeFlags = [ "no", "false", "0" ];

function resolveFlag(name) {
  const value = (resolveInternal(name) || "").toLowerCase();
  if (positiveFlags.indexOf(value) > -1) {
    logResolved(name, true);
    return true;
  }
  if (negativeFlags.indexOf(value) > -1) {
    logResolved(name, false);
    return false;
  }
  throw new Error(`environmental flag not set and no default: ${name}`);
}

function explode(str, delimiter) {
  return str
    .split(delimiter || ",")
    .map(p => p.trim())
    .filter(p => !!p);
}

const registerEnvironmentVariables = require("./register-environment-variables");
registerEnvironmentVariables(toExport);

module.exports = toExport;
