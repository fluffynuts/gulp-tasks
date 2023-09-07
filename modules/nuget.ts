(function() {
  const
    resolveNuget = requireModule<ResolveNuget>("resolve-nuget"),
    findLocalNuget = requireModule<FindLocalNuget>("find-local-nuget"),
    tryDo = requireModule<TryDo<string>>("try-do"),
    exec = requireModule<Exec>("exec");

  module.exports = async function(
    args: string[],
    opts?: SystemOptions
  ): Promise<string> {
    const
      resolvedNuget = resolveNuget(undefined, false),
      nugetPath = resolvedNuget || await findLocalNuget(),
      argsCopy = args.slice();
    return await tryDo(
      async () => {
        return await exec(nugetPath, argsCopy, opts);
      },
      "RESTORE_RETRIES"
    )
  }
})();
