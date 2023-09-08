(function () {
    "use strict";
    const
        Version = requireModule<Version>("version"),
        log = requireModule<Log>("log"),
        fs = require("fs"),
        path = require("path"),
        debug = requireModule<DebugFactory>("debug")(__filename),
        {
            lsSync,
            FsEntities
        } = require("yafs"),
        programFilesFolder = process.env["ProgramFiles(x86)"]
            || process.env["ProgramFiles"],
        getToolsFolder = requireModule<GetToolsFolder>("get-tools-folder"),
        ZarroError = requireModule<ZarroError>("zarro-error"),
        which = requireModule<Which>("which"),
        localAppDataFolder = process.env["LOCALAPPDATA"];

    function isUnstable(folderName: string) {
        return folderName.indexOf("alpha") > -1 ||
            folderName.indexOf("beta") > -1;
    }


    interface TestUtilFolder {
        folder: string;
        version: number[];
    }

    function finder(
        searchBaseFolders: Optional<string>[],
        searchBaseSubFolder: Optional<string>,
        searchFolderPrefix: string,
        searchBin: string,
        options: TestUtilFinderOptions
    ) {
        const
            ignoreBetas = options.ignoreBetas === undefined ? true : options.ignoreBetas,
            lprefix = searchFolderPrefix.toLowerCase();
        if (!Array.isArray(searchBaseFolders)) {
            searchBaseFolders = [ searchBaseFolders ];
        }
        const runner = searchBaseFolders
            .filter(f => !!f)
            .map(f => {
                return searchBaseSubFolder
                    ? path.join(
                        f,
                        searchBaseSubFolder
                    )
                    : f;
            })
            .filter(checkExists)
            .reduce(
                (possibles: TestUtilFolder[], baseFolder) => {
                    debug("Searching: " + baseFolder);
                    return fs.readdirSync(baseFolder)
                        .reduce(
                            (acc: TestUtilFolder[], cur: string) => {
                                const folder = path.join(
                                    baseFolder,
                                    cur
                                );
                                const lcur = cur.toLowerCase();
                                if (lcur.indexOf(lprefix) === 0) {
                                    if (ignoreBetas && isUnstable(lcur)) {
                                        log.notice("Ignoring unstable tool at: " + folder);
                                        return acc;
                                    }
                                    const match = cur.match(/\d+/g);
                                    if (!match) {
                                        return acc;
                                    }
                                    const version = match.map(Number);
                                    debug(`Adding possible: ${ folder } = version ${ version }`);
                                    acc.push({
                                        folder: folder,
                                        version: version
                                    });
                                }
                                return acc;
                            },
                            possibles
                        );
                },
                []
            )
            .sort((x: TestUtilFolder, y: TestUtilFolder) => compareVersionArrays(
                x.version,
                y.version
            ))
            .map((possible: TestUtilFolder) => path.join(
                possible.folder,
                searchBin
            ))
            .find(checkExists);
        if (runner) {
            log.debug("Using " + runner);
        }
        return runner;
    }

    function compareVersionArrays(
        x: number[],
        y: number[]
    ) {
        const
            left = new Version(x),
            right = new Version(y);
        const result = left.compareWith(right);
        // Version::compareWith should compare in natural order (ascending)
        // and we want descending so we can pick the first one as the top
        // - but, on the other hand, -0 is a thing :/
        return result === 0
            ? 0
            : -result;
    }

    function findWrapper(
        func: (() => string),
        name: string
    ) {
        const found = func();
        if (!found) {
            debug(`Can't find any installed ${ name }`);
        }
        return found;
    }

    function findInstalledNUnit3() {
        if (!programFilesFolder) {
            return null;
        }
        const search = path.join(
            programFilesFolder,
            "NUnit.org",
            "nunit-console",
            "nunit3-console.exe"
        );
        if (!search) {
            return null;
        }
        return fs.existsSync(search) ? search : null;
    }

    function checkExists(somePath: string) {
        debug(`Checking if file exists: ${ somePath }`);
        return fs.existsSync(somePath) ? somePath : undefined;
    }

    function tryToFindNUnit(options: TestUtilFinderOptions) {
        return initialToolSearch(
                "nunit3-console.exe",
                "NUNIT"
            ) ||
            searchForNunit(options);
    }

    function latestNUnit(options: TestUtilFinderOptions): Optional<string> {
        const result = tryToFindNUnit(options);
        debug(`Using nunit runner: ${ result || "NOT FOUND" }`);
        return result;
    }

    function nunit2Finder(
        searchBin: string,
        options: TestUtilFinderOptions
    ): Optional<string> {
        if (!programFilesFolder) {
            return undefined;
        }
        return finder(
            [ programFilesFolder ],
            undefined,
            "NUnit",
            searchBin,
            options
        );
    }

    function searchForNunit(options: TestUtilFinderOptions) {
        options = options || {};
        const isX86 = (options.x86 || ((options.platform || options.architecture) === "x86"));
        const runner = isX86 ? "/bin/nunit-console-x86.exe" : "/bin/nunit-console.exe";
        return findWrapper(
            function () {
                return findInstalledNUnit3() || nunit2Finder(
                    runner,
                    options
                );
            },
            "nunit-console runner"
        );
    }

    // FIXME: should ignore, eg, foo.csproj, to find foo.exe|bat|com on windows
    // FIXME: when not on windows, should always do exact match
    function findTool(
        exeName: string,
        underFolder?: string
    ): Optional<string> {
        const
            { chopExtension } = requireModule<PathUtils>("path-utils"),
            withoutExtension = chopExtension(exeName),
            exeHasExtension = exeName !== withoutExtension;
        const allResults = lsSync(
            underFolder || getToolsFolder(),
            {
                recurse: true,
                entities: FsEntities.files,
                fullPaths: true
            })
            .filter((p: string) => {
                const
                    thisFileExtension = path.extname(p),
                    parts = p.split(/[\\\/]/g),
                    filename = parts[parts.length - 1];
                debugger;
                if (thisFileExtension) {
                    if (exeHasExtension) {
                        return filename.toLowerCase() === exeName.toLowerCase()
                    } else {
                        const chopped = chopExtension(filename);
                        return chopped.toLowerCase() === withoutExtension.toLowerCase();
                    }
                } else {
                    return filename.toLowerCase() === withoutExtension.toLowerCase();
                }
            })
            .sort();
        debugger;
        return allResults[0] || which(exeName);
    }

    function locateDotCover(
        options: TestUtilFinderOptions
    ) {
        options = options || {};
        return initialToolSearch(
                "dotCover.exe",
                "DOTCOVER"
            ) ||
            findWrapper(
                function () {
                    return finder(
                            [ programFilesFolder, localAppDataFolder ],
                            "JetBrains/Installations",
                            "dotCover",
                            "dotCover.exe",
                            options
                        )
                        || finder(
                            [ programFilesFolder ],
                            "JetBrains/dotCover",
                            "v",
                            "Bin/dotCover.exe",
                            options
                        );
                },
                "dotCover"
            );
    }

    function latestDotCover(
        options: TestUtilFinderOptions
    ): Optional<string> {
        const result = locateDotCover(options);
        debug(`Using dotCover: ${ result || "NOT FOUND" }`);
        return result;
    }

    function initialToolSearch(
        toolExe: string,
        environmentVariable: string
    ): Optional<string> {
        const fromEnvironment = process.env[environmentVariable];
        if (fromEnvironment) {
            if (!fs.existsSync(fromEnvironment)) {
                throw new ZarroError(`${ fromEnvironment } specified in environment variable ${ environmentVariable } not found`);
            }
            return fromEnvironment;
        }
        return findTool(toolExe);
    }

    function latestOpenCover(): Optional<string> {
        const result = initialToolSearch(
            "OpenCover.Console.exe",
            "OPENCOVER"
        );
        debug(`Using opencover: ${ result || "NOT FOUND" }`);
        return result;
    }

    module.exports = {
        latestNUnit: latestNUnit,
        latestDotCover: latestDotCover,
        latestOpenCover: latestOpenCover,
        findTool: findTool,
        nunit2Finder: nunit2Finder,
        compareVersionArrays: compareVersionArrays
    };
})();
