(function() {
  const
    resolveNuget = requireModule<ResolveNuget>("resolve-nuget"),
    findLocalNuget = requireModule<FindLocalNuget>("find-local-nuget"),
    tryDo = requireModule<TryDo<string>>("try-do"),
    exec = requireModule<Exec>("exec");

  module.exports = async function(args: string[], execOpts: ExecOpts) {
    const
      resolvedNuget = resolveNuget(undefined, false),
      nugetPath = resolvedNuget || await findLocalNuget(),
      argsCopy = args.slice();
    return await tryDo(
      () => exec(nugetPath, argsCopy, execOpts),
      "RESTORE_RETRIES"
    )
  }
})();
