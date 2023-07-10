(function() {
  console.warn(`${__filename} is maintained as a compatibility shim to csproj-utils - rather use that`);
  const
    { readPackageVersion } = requireModule<CsProjUtils>("csproj-utils");
  module.exports = readPackageVersion;
})();

export {};
