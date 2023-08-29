"use strict";
(function () {
    const env = requireModule("env");
    function resolveNugetApiKey(source) {
        debugger;
        const requestedSource = resolveSource(source);
        debugger;
        if (!requestedSource) {
            throw new Error(`unable to determine source to resolve nuget api key for`);
        }
        const multiKeys = resolveKeysPerHost(), perSource = findValue(multiKeys, requestedSource), multiKeyFallback = findValue(multiKeys, "*"), ultimateFallback = env.resolve(env.NUGET_API_KEY);
        return perSource || multiKeyFallback || ultimateFallback || undefined;
    }
    function resolveKeysPerHost() {
        const blob = env.resolve(env.NUGET_API_KEYS);
        if (!blob) {
            const defaultSource = resolveSource(), defaultKey = env.resolve(env.NUGET_API_KEY);
            if (defaultKey && defaultSource) {
                return {
                    [defaultSource]: defaultKey
                };
            }
            if (defaultKey) {
                return generateDefaultKeys(defaultKey);
            }
            return {};
        }
        if (!!blob.match(/{+.*:+/)) {
            return JSON.parse(blob);
        }
        else {
            return generateDefaultKeys(blob);
        }
    }
    function generateDefaultKeys(k) {
        return {
            ["*"]: k
        };
    }
    function findValue(keys, seek) {
        if (!keys || !seek) {
            return undefined;
        }
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
