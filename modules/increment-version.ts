(function() {
    const
        ZarroError = requireModule<ZarroError>("zarro-error"),
        generateVersionSuffix = requireModule<GenerateVersionSuffix>("generate-version-suffix");

    function zeroFrom(parts: number[], startIndex: number) {
        for (let i = startIndex; i < parts.length; i++) {
            parts[i] = 0;
        }
    }

    function incrementAt(
        parts: number[],
        index: number,
        incrementBy: number
    ) {
        if (parts[index] === undefined) {
            throw new ZarroError(`version '${ parts.join(".") }' has no value at position ${ index }`);
        }
        parts[index] += incrementBy;
    }

    const incrementLookup: { [key: string]: number } = {
        "prerelease": -1,
        "major": 0,
        "minor": 1,
        "patch": 2
    };

    module.exports = function incrementVersion(
        version: string,
        strategy: VersionIncrementStrategy,
        zeroLowerOrder: boolean = true,
        incrementBy: number = 1
    ): string {
        const
            dashedParts = version.split("-"),
            parts = dashedParts[0].split(".").map(i => parseInt(i));
        let toIncrement = incrementLookup[(strategy || "").toLowerCase()]
        if (toIncrement === undefined) {
            throw new ZarroError(`Unknown version increment strategy: ${ strategy }\n try one of 'major', 'minor' or 'patch'`);
        }
        if (strategy != "prerelease") {
            const shouldNotActuallyIncrement = strategy === "patch" &&
                dashedParts.length > 1;
            if (!shouldNotActuallyIncrement) {
                incrementAt(parts, toIncrement, incrementBy);
            }
            if (zeroLowerOrder) {
                zeroFrom(parts, toIncrement + 1);
            }
        } else {
            // bump the minor if this is the first pre-release
            if (dashedParts.length === 1) {
                incrementAt(parts, 2, 1);
            }
        }
        const result = parts.join(".");
        if (strategy != "prerelease") {
            return result;
        }
        return `${ result }-${generateVersionSuffix()}`;
    }

})()
