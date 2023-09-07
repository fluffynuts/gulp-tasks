"use strict";
(function () {
    const packageLookup = {
        [`${ZarroTestPackage.local}`]: undefined,
        [`${ZarroTestPackage.beta}`]: "zarro@beta",
        [`${ZarroTestPackage.latest}`]: "zarro@latest"
    };
    async function testZarro(opts) {
        const log = requireModule("log"), system = requireModule("system");
        if (!opts) {
            throw new Error(`no options provided`);
        }
        const tasks = opts.tasks;
        if (!tasks) {
            throw new Error(`'tasks' not defined on options`);
        }
        const taskArray = Array.isArray(tasks)
            ? tasks
            : [tasks];
        let restoreVersion = undefined;
        if (opts.rollback) {
            restoreVersion = await readCurrentZarroVersion();
        }
        const toInstall = packageLookup[opts.package];
        if (toInstall) {
            await system("npm", ["install", "--no-save", toInstall]);
        }
        try {
            for (const task of tasks) {
                await system("npm", ["run", task]);
            }
        }
        catch (e) {
            log.error(`test run fails:\n${e}`);
        }
        finally {
            await restoreZarroAt(restoreVersion);
        }
    }
    async function restoreZarroAt(version) {
        const system = requireModule("system");
        if (!version) {
            return;
        }
        await system("npm", ["install", "--no-save", version]);
    }
    async function readCurrentZarroVersion() {
        const { readTextFile } = require("yafs"), log = requireModule("log");
        try {
            const packageIndex = JSON.parse(await readTextFile("package.json"));
            return findPackageVersion("zarro", packageIndex.dependencies)
                || findPackageVersion("zarro", packageIndex.devDependencies);
        }
        catch (e) {
            log.warn(`Unable to read package.json: cannot restore prior zarro state.\n${e}`);
            return undefined;
        }
    }
    function findPackageVersion(packageName, registry) {
        if (!registry) {
            return undefined;
        }
        return registry[packageName];
    }
    module.exports = testZarro;
})();
