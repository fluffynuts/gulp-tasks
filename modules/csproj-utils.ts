(function() {
    const
        parseXml = requireModule<ParseXml>("parse-xml"),
        fallbackAssemblyVersion = "1.0.0",
        path = require("path"),
        { readTextFile } = require("yafs");


    async function readProjectVersion(pathToCsProj: string) {
        return readCsProjProperty(
            pathToCsProj,
            "Version",
            fallbackAssemblyVersion
        );
    }

    async function readPackageVersion(pathToCsProj: string) {
        return readCsProjProperty(
            pathToCsProj,
            "PackageVersion",
            fallbackAssemblyVersion
        );
    }

    async function readAssemblyVersion(pathToCsProj: string) {
        return readCsProjProperty(
            pathToCsProj,
            "AssemblyVersion",
            fallbackAssemblyVersion
        );
    }

    function determineAssemblyNameFromProjectPath(
        pathToCsProj: string
    ): string {
        const
            basename = path.basename(pathToCsProj);
        return basename.replace(/\.csproj$/i, "");
    }

    async function readAssemblyName(pathToCsProj: string) {
        return await readCsProjProperty(
            pathToCsProj,
            "AssemblyName",
            async () => determineAssemblyNameFromProjectPath(pathToCsProj)
        );
    }

    function readTextFrom(node: string[]): string | undefined {
        return node
            ? node[0]
            : undefined;
    }

    function tryReadNodeFrom(
        groups: any[],
        nodeName: string
    ): string | undefined {
        return groups.reduce(
            (acc: string | undefined, cur: any) =>
                acc || readTextFrom(cur[nodeName]),
            undefined
        );
    }

    async function readCsProjProperty(
        pathToCsProj: string,
        property: string,
        fallback?: string | (() => Promise<string>)
    ): Promise<Optional<string>> {
        const
            contents = await readTextFile(pathToCsProj),
            doc = await parseXml(contents);

        try {
            const
                propertyGroups = doc.Project.PropertyGroup
            const result = tryReadNodeFrom(propertyGroups, property);
            if (!!result) {
                return result;
            }
            return await resolveFallback(fallback);
        } catch (e) {
            return await resolveFallback();
        }
    }

    async function resolveFallback(
        fallback?: string | (() => Promise<string>)
    ) {
        if (fallback === undefined) {
            return undefined;
        }
        if (typeof fallback === "string") {
            return fallback;
        }
        return await fallback();
    }

    module.exports = {
        readProjectVersion,
        readAssemblyVersion,
        readPackageVersion,
        readAssemblyName,
        readCsProjProperty
    };
})();
