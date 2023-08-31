"use strict";
(function () {
    const env = requireModule("env");
    function resolveNugetApiKey(source) {
        const allKeys = resolveSourceToKeyLookup(), requestedSource = resolveSource(source);
        if (!requestedSource) {
            return findValue(allKeys, "nuget.org") || findValue(allKeys, "*");
        }
        const perSource = findValue(allKeys, requestedSource), multiKeyFallback = findValue(allKeys, "*"), nugetOrgFallback = findValue(allKeys, "nuget.org"), ultimateFallback = env.resolve(env.NUGET_API_KEY);
        return perSource || multiKeyFallback || nugetOrgFallback || ultimateFallback || undefined;
    }
    function resolveSourceToKeyLookup() {
        const defaultKey = env.resolve(env.NUGET_API_KEY), blob = env.resolve(env.NUGET_API_KEYS);
        if (!blob) {
            const defaultSource = resolveSource();
            if (!defaultKey) {
                return {};
            }
            const result = generateDefaultKeyContainer(defaultKey);
            return defaultSource
                ? Object.assign(Object.assign({}, result), { [defaultSource]: defaultKey }) : result;
        }
        if (!!blob.match(/{+.*:+/)) {
            return Object.assign(Object.assign({}, generateDefaultKeyContainer(defaultKey)), JSON.parse(blob));
        }
        else {
            return generateDefaultKeyContainer(blob);
        }
    }
    function generateDefaultKeyContainer(k) {
        return {
            ["*"]: k
        };
    }
    function findValue(keys, seek) {
        if (!keys || !seek) {
            return undefined;
        }
        const exactMatch = keys[seek];
        if (exactMatch) {
            return exactMatch;
        }
        return fuzzyFindValue(keys, seek);
    }
    function fuzzyFindValue(keys, seek) {
        const keyLookup = Object.keys(keys)
            .reduce((acc, cur) => {
            acc[cur.toLowerCase()] = cur;
            return acc;
        }, {});
        const key = keyLookup[seek.toLowerCase()];
        return keys[key];
    }
    function resolveSource(source) {
        if (source) {
            return source;
        }
        return env.resolve(env.NUGET_PUSH_SOURCE)
            || env.resolve(env.NUGET_SOURCE)
            || (env.resolveArray(env.NUGET_SOURCES) || [])[0];
    }
    module.exports = resolveNugetApiKey;
})();
