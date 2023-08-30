(function() {
    const env = requireModule<Env>("env");

    function resolveNugetApiKey(
        source?: string
    ): Optional<string> {
        const
            allKeys = resolveSourceToKeyLookup(),
            requestedSource = resolveSource(source);
        if (!requestedSource) {
            return findValue(allKeys, "nuget.org") || findValue(allKeys, "*");
        }
        const
            perSource = findValue(allKeys, requestedSource),
            multiKeyFallback = findValue(allKeys, "*"),
            nugetOrgFallback = findValue(allKeys, "nuget.org"),
            ultimateFallback = env.resolve(env.NUGET_API_KEY);
        debugger;
        return perSource || multiKeyFallback || nugetOrgFallback || ultimateFallback || undefined;
    }

    function resolveSourceToKeyLookup(): Dictionary<string> {
        debugger;
        const
            defaultKey = env.resolve(env.NUGET_API_KEY),
            blob = env.resolve(env.NUGET_API_KEYS);
        if (!blob) {
            const defaultSource = resolveSource();
            if (!defaultKey) {
                return {};
            }
            const result = generateDefaultKeyContainer(defaultKey);
            return defaultSource
                ? { ...result, [defaultSource]: defaultKey }
                : result;
        }
        if (!!blob.match(/{+.*:+/)) {
            return {
                ...generateDefaultKeyContainer(defaultKey),
                ...JSON.parse(blob)
            };
        } else {
            return generateDefaultKeyContainer(blob);
        }
    }

    function generateDefaultKeyContainer(k: string) {
        return {
            ["*"]: k
        };
    }

    function findValue(
        keys: Optional<Dictionary<string>>,
        seek: string
    ): Optional<string> {
        if (!keys || !seek) {
            return undefined;
        }
        const exactMatch = keys[seek];
        if (exactMatch) {
            return exactMatch;
        }

        return fuzzyFindValue(keys, seek);
    }

    function fuzzyFindValue(
        keys: Dictionary<string>,
        seek: string
    ): Optional<string> {
        const keyLookup = Object.keys(keys)
            .reduce(
                (acc: Dictionary<string>, cur: string) => {
                    acc[cur.toLowerCase()] = cur;
                    return acc;
                }, {} as Dictionary<string>
            );
        const key = keyLookup[seek.toLowerCase()];
        return keys[key];
    }

    function resolveSource(source?: string): string {
        debugger;
        if (source) {
            return source;
        }
        return env.resolve(env.NUGET_PUSH_SOURCE)
            || env.resolve(env.NUGET_SOURCE)
            || (env.resolveArray(env.NUGET_SOURCES) || [])[0]
    }

    module.exports = resolveNugetApiKey;
})();
