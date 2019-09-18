const multiSplit = require("./multi-split"),
  debug = require("debug")("net-framework-test-assembly-filter");

function findBuildConfigFrom(pathParts) {
  const oneUp = pathParts[pathParts.length - 2];
  if (oneUp === undefined) {
    return "";
  }
  if (oneUp.match(/^net(standard\d\.\d|\d{3}|coreapp\d\.\d)$/)) {
    // one-up is a release target... travel one higher
    return pathParts[pathParts.length - 3] || "";
  }
  return oneUp;
}

module.exports = function generateFilter(configuration) {
  return function netFrameworkTestAssemblyFilter(vinylFile) {
    const parts = multiSplit(vinylFile.path, ["/", "\\"]),
      isNetCore = !!parts.filter(p => p.match(/^netcore/)).length,
      assemblyName = parts[parts.length - 1].replace(/\.dll$/gi, ""),
      isPrimary = !!parts
        .slice(0, parts.length - 1)
        .filter(p => p.toLowerCase() === assemblyName.toLowerCase()).length;
    (isBin = !!parts.filter(p => p.match(/^bin$/i)).length),
      (buildConfig = findBuildConfigFrom(parts)),
      (isDebug = buildConfig.toLowerCase() === "debug"),
      (isForConfig = buildConfig.toLowerCase() === configuration.toLowerCase()),
      (isAny = (parts[parts.length - 1] || "").toLowerCase() === "bin"),
      (include =
        !isNetCore && isPrimary && isBin && (isDebug || isAny || isForConfig));
    debug({
      path: vinylFile.path,
      parts,
      buildConfig,
      isNetCore,
      isPrimary,
      isDebug,
      isAny,
      isBin,
      isForConfig,
      include
    });
    return include;
  };
};
