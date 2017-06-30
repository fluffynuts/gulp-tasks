function getVar(varName, fallback) {
  const envVar = process.env[varName];
  return envVar === undefined
          ? fallback
          : envVar
}
function getArray(varName, fallback, delimiters) {
  if (delimiters === undefined) {
    delimiters = [ ",", ";" ];
  }
  if (!Array.isArray(delimiters)) {
    delimiters = [ delimiters ];
  }
  const value = getVar(varName, undefined);
  return value === undefined
          ? fallback
          : multiSplit(value, delimiters);
}

function multiSplit(value, delimiters) {
  if (!Array.isArray(delimiters)) {
    delimiters = [ delimiters ];
  }
  return delimiters.reduce((dacc, dcur) => {
    return dacc.reduce((acc, cur) => {
      if (!Array.isArray(cur)) {
        cur = [ cur ];
      }
      cur.forEach(c => acc.push.apply(acc, c.split(dcur)));
      return acc;
    }, []);
  }, [value]);
}

module.exports = {
  getArray,
  getVar,
  multiSplit
}