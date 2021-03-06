const
  spawn = require("./spawn"),
  quoteIfRequired = require("./quote-if-required"),
  splitPath = require("./split-path"),
  env = require("./env"),
  findLocalNuget = require("./find-local-nuget");

function isDotnetCore(binaryPath) {
  const
    trimmed = binaryPath.replace(/^"/, "")
              .replace(/"$/, ""),
    parts = splitPath(trimmed),
    executable = (parts[parts.length-1] || "");
  return !!executable.match(/^dotnet(:?\.exe)?$/i);
}

async function nugetPush(
  packageFile,
  sourceName,
  options) {
  options = options || {};
  options.suppressDuplicateError = options.suppressDuplicateError === undefined
    ? env.resolveFlag("NUGET_IGNORE_DUPLICATE_PACKAGES")
    : options.suppressDuplicateError;

  const
    apiKey = env.resolve("NUGET_API_KEY"),
    nuget = await findLocalNuget(),
    dnc = isDotnetCore(nuget),
    sourceArg = dnc ? "--source" : "-Source",
    // ffs dotnet core breaks things that used to be simple
    // -> _some_ nuget commands require 'dotnet nuget ...'
    // -> _others_ don't, eg 'dotnet restore'
    start = dnc ? [ "nuget" ] : [],
    args = start.concat([
      "push",
      quoteIfRequired(packageFile),
      sourceArg,
      sourceName || "nuget.org"
    ]),
    apiKeyArg = dnc ? "-k" : "-ApiKey";
  if (apiKey) {
    args.push.call(args, apiKeyArg, apiKey);
  }
  if (env.resolveFlag("DRY_RUN")) {
    console.log(`nuget publish dry run: ${nuget} ${args.join(" ")}`);
    return;
  }
  console.log(`pushing package ${packageFile}`);
  try {
    return await spawn(nuget, args);
  } catch (e) {
    if (e.info && Array.isArray(e.info.stderr)) {
      const
        errors = e.stderr.join("\n").trim(),
        isDuplicatePackageError = errors.match(/: 409 /);
      if (isDuplicatePackageError && options.suppressDuplicateError) {
        console.warn(`ignoring duplicate package error: ${errors}`);
        return e.info;
      }
    }
    throw e;
  }
}

module.exports = nugetPush;
