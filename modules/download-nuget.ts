(function () {
    const
        retry = requireModule<Retry<string>>("retry"),
        ZarroError = requireModule<ZarroError>("zarro-error"),
        HttpClient = requireModule<HttpClientModule>("http-client"),
        nugetUpdateSelf = requireModule<NugetUpdateSelf>("nuget-update-self"),
        log = requireModule<Log>("log"),
        path = require("path"),
        shimNuget = requireModule<ShimNuget>("shim-nuget"),
        url = "http://dist.nuget.org/win-x86-commandline/latest/nuget.exe";

    async function downloadNugetTo(
        targetFolder: string,
        quiet?: boolean
    ): Promise<string> {
        log.debug(`Attempting to download nuget.exe to ${ targetFolder }`);
        const
            downloader = HttpClient.create();
        downloader.suppressProgress = !!quiet;
        debugger;
        const downloaded = await downloader.download(
            url,
            path.join(targetFolder, "nuget.exe")
        )
        const result = shimNuget(downloaded);
        await validateCanRunExe(result);
        return result;
    }

    const
        validators = {} as Dictionary<Promise<string>>,
        cached = {} as Dictionary<boolean>;

    function validateCanRunExe(exePath: string): Promise<string> {
        if (!!validators[exePath]) {
            return validators[exePath];
        }
        const shouldLog = !validators[exePath];
        if (shouldLog) {
            log.debug(`validating exe at: ${ exePath }`);
        }
        return validators[exePath] = new Promise(async (resolve, reject) => {
            let
                lastError = "unknown error",
                attempts = 0;

            if (cached[exePath]) {
                return resolve(exePath);
            }
            do {
                try {
                    await nugetUpdateSelf(exePath);
                    return resolve(exePath);
                } catch (e) {
                    const err = e as Error;
                    lastError = err.message || `${ e }`;
                    if (shouldLog) {
                        log.debug(`failed to run executable (${
                            err.message
                        }); ${
                            attempts < 9
                                ? "will try again"
                                : "giving up"
                        }`);
                    }
                }
            } while (attempts++ < 9);

            reject(new ZarroError(`Unable to download nuget.exe: ${ lastError }`));
        });
    }

    module.exports = async function downloadNuget(
        targetFolder: string,
        quiet?: boolean
    ) {
        let downloaded = await retry(() =>
            downloadNugetTo(targetFolder, quiet)
        );
        log.info(`nuget downloaded to: ${ downloaded }`);
        return downloaded;
    };

})();
