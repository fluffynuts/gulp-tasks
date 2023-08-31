(function() {
    const
        env = requireModule<Env>("env"),
        resolveMasks = requireModule<ResolveMasks>("resolve-masks");

    module.exports = function resolveTestMasks(
        isDotnetCore?: boolean
    ) {
        if (isDotnetCore === undefined) {
            isDotnetCore = env.resolveFlag("DOTNET_CORE");
        }
        return resolveMasks("TEST_INCLUDE", "TEST_EXCLUDE", p => {
            if (p.match(/\*\*$/)) {
                p += "/*";
            }
            return isDotnetCore
                ? `${ p }.csproj`
                : `${ p }.dll`
        });
    };
})();
