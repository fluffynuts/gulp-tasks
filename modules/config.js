var
  env = requireModule("env"),
  path = require('path');

module.exports = {
  localNuget: path.join(env.resolve("BUILD_TOOLS_FOLDER"), 'nuget.exe'),
  nugetDownloadUrl: 'http://dist.nuget.org/win-x86-commandline/latest/nuget.exe'
};
