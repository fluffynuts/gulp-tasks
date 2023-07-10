(function() {
  console.warn(`${__filename} is maintained as a compatibility shim to csproj-utils - rather use that`);
  const
    { readProjectVersion } = requireModule<CsProjUtils>("csproj-utils");
  module.exports = readProjectVersion;
})();
