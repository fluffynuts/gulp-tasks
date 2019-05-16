const
  spawn = require("./spawn"),
  debug = require("debug")("spawn-nuget"),
  findLocalNuget = require("./find-local-nuget");
module.exports = async function(args, opts) {
  const nuget = await findLocalNuget();
  debug(`spawn nuget: ${nuget} ${args.join(" ")}`);
  if (opts && Object.keys(opts).length) {
    debug(` nuget spawn options: ${JSON.stringify(opts)}`);
  }
  return await spawn(nuget, args, opts);
}
