const
  spawn = require("./spawn"),
  findLocalNuget = require("./find-local-nuget");
module.exports = async function(args, opts) {
  const nuget = await findLocalNuget();
  return await spawn(nuget, args, opts);
}
