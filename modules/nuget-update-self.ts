(function () {
  const
    spawn = requireModule<Spawn>("spawn");
  let updating: Promise<void> | undefined;
  module.exports = function (nugetPath: string) {
    if (updating) {
      return updating;
    }
    return updating = new Promise<void>(async (resolve, reject) => {
      try {
        await spawn(nugetPath, ["update", "-self"]);
        updating = undefined;
        resolve();
      } catch (e) {
        updating = undefined;
        reject(e);
      }
    })
  };
})();
