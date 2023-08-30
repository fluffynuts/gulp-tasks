import { BufferFile } from "vinyl";
(function() {
    const
        { readTextFileSync } = require("yafs"),
        gulp = requireModule<Gulp>("gulp"),
        xml2js = require("xml2js"),
        throwIfNoFiles = requireModule<ThrowIfNoFiles>("throw-if-no-files"),
        env = requireModule<Env>("env"),
        debug = requireModule<DebugFactory>("debug")(__filename),
        es = require("event-stream");

    module.exports = async function areAllDotnetCore(
        gulpSrcSpecs: string | string[]
    ) {
        if (process.env.DOTNETCORE !== undefined) {
            return env.resolveFlag("DOTNET_CORE");
        }
        return await new Promise(
            async resolve => {
                const projFiles = [] as string[];
                gulp
                    .src(gulpSrcSpecs, { allowEmpty: true })
                    .pipe(throwIfNoFiles(`No projects found for [ "${projFiles.join('", "')}" ]`))
                    .pipe(
                        (() => {
                            return es.through(
                                function write(file: BufferFile) {
                                    if (!file) {
                                        return;
                                    }
                                    projFiles.push(file.path);
                                },
                                async function end() {
                                    if (projFiles.length === 0) {
                                        return resolve(false);
                                    }
                                    for (const proj of projFiles) {
                                        const isCoreOrStandard = await allTargetsAreCoreOrFramework(
                                            proj
                                        );
                                        if (!isCoreOrStandard) {
                                            resolve(false);
                                        }
                                    }
                                    resolve(true);
                                }
                            );
                        })()
                    );
            });
    };

    async function allTargetsAreCoreOrFramework(
        csproj: string
    ) {
        return new Promise(async (resolve, reject) => {
            try {
                debug(`testing for netcore/netstandard: ${ csproj }`);
                const
                    contents = readTextFileSync(csproj),
                    parser = new xml2js.Parser();
                parser.parseString(contents, (err: Error | null, data: any) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!data.Project) {
                        resolve(false);
                    }
                    try {
                        let foundTargetFrameworksNode = false;
                        const allCoreOrStandard = (data.Project.PropertyGroup || []).reduce(
                            (acc: boolean, cur: any) => {
                                const targetFrameworksNode =
                                    cur.TargetFramework || cur.TargetFrameworks;
                                if (!targetFrameworksNode) {
                                    return acc;
                                }
                                foundTargetFrameworksNode = true;
                                const targetFrameworks = targetFrameworksNode.join("").split(";");
                                debug(`have target framework(s): ${ targetFrameworks }`);
                                return (
                                    acc &&
                                    targetFrameworks.reduce((acc2: boolean, cur2: string) => {
                                        return (
                                            acc2 &&
                                            (cur2.indexOf("netstandard") === 0 ||
                                                cur2.indexOf("netcoreapp") === 0)
                                        );
                                    }, true)
                                );
                            },
                            true
                        ) && foundTargetFrameworksNode;
                        debug(`all targets are core/standard: ${ allCoreOrStandard }`);
                        resolve(allCoreOrStandard);
                    } catch (e) {
                        reject(e);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
})();
