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

module.exports = {
  flag,
  fallback
};
