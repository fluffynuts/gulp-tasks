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

async function nugetPush(packageFile, sourceName) {
  const
    nuget = await findLocalNuget(),
    args = [
      "push",
      quoteIfRequired(packageFile),
      "-Source",
      sourceName || "nuget.org"
    ];
  if (isDotnetCore(nuget)) {
    // ffs dotnet core breaks things that used to be simple
    // -> _some_ nuget commands require 'dotnet nuget ...'
    // -> _others_ don't, eg 'dotnet restore'
    args.splice(0, 0, "nuget");
  }
  if (env.resolveFlag("DRY_RUN")) {
    console.log(`nuget publish dry run: ${nuget} ${args.join(" ")}`);
    return;
  }
  console.log(`pushing package ${packageFile}`);
  return spawn(nuget, args);
}

module.exports = nugetPush;
