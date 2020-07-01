import { ExecOpts } from "./exec";

(function() {
  const
    resolveNuget = require("./resolve-nuget"),
    exec = require("./exec");

  module.exports = async function(args: string[], execOpts: ExecOpts) {
    const
      nugetPath = await resolveNuget(),
      argsCopy = args.slice();
    return exec(nugetPath, argsCopy, execOpts);
  }
})();
