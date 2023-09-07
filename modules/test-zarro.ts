(function () {
    const
        packageLookup = {
            [`${ ZarroTestPackage.local }`]: undefined,
            [`${ ZarroTestPackage.beta }`]: "zarro@beta",
            [`${ ZarroTestPackage.latest }`]: "zarro@latest"
        } as Dictionary<Optional<string>>;

    async function testZarro(opts: TestZarroOptions): Promise<void> {
        const
            log = requireModule<Log>("log"),
            system = requireModule<System>("system");
        if (!opts) {
            throw new Error(`no options provided`);
        }
        const tasks = opts.tasks;
        if (!tasks) {
            throw new Error(`'tasks' not defined on options`);
        }

        const taskArray = Array.isArray(tasks)
            ? tasks
            : [ tasks ];

        let restoreVersion = undefined as Optional<string>;
        if (opts.rollback) {
            restoreVersion = await readCurrentZarroVersion();
        }
        const toInstall = packageLookup[opts.package];
        if (toInstall) {
            await system(
                "npm",
                [ "install", "--no-save", toInstall ]
            );
        }

        try {
            for (const task of tasks) {
                await system(
                    "npm",
                    [ "run", task ]
                );
            }
        } catch (e) {
            log.error(`test run fails:\n${ e }`);
        } finally {
            await restoreZarroAt(restoreVersion);
        }
    }

    async function restoreZarroAt(version: Optional<string>): Promise<void> {
        const
            system = requireModule<System>("system");
        if (!version) {
            return;
        }
        await system(
            "npm",
            [ "install", "--no-save", version ]
        );
    }

    async function readCurrentZarroVersion() {
        const
            { readTextFile } = require("yafs"),
            log = requireModule<Log>("log");

        try {
            const packageIndex = JSON.parse(
                await readTextFile(
                    "package.json"
                )
            ) as PackageIndex;
            return findPackageVersion("zarro", packageIndex.dependencies)
                || findPackageVersion("zarro", packageIndex.devDependencies)
        } catch (e) {
            log.warn(`Unable to read package.json: cannot restore prior zarro state.\n${ e }`);
            return undefined;
        }
    }

    function findPackageVersion(
        packageName: string,
        registry: Optional<Dictionary<string>>
    ): Optional<string> {
        if (!registry) {
            return undefined;
        }
        return registry[packageName];
    }

    module.exports = testZarro;
})();
