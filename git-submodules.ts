(function() {
    const
        system = requireModule<System>("system"),
        path = require("path"),
        gulp = requireModule<Gulp>("gulp"),
        log = requireModule<Log>("log"),
        { existsSync, readTextFile, mkdir } = require("yafs"),
        subModulesFile = ".gitmodules";

    gulp.task("git-submodules", "Updates (with --init) all submodules in tree", function() {
        return system("git", [ "submodule", "update", "--init", "--recursive" ]);
    });

    gulp.task("git-submodules-as-externals", async () => {
        if (!existsSync(subModulesFile)) {
            log.notice("no submodules file found");
            return;
        }
        log.notice("performing submodule init/update...");
        await system("git", [ "submodule", "update", "--init", "--recursive" ]);
        log.info("getting list of local submodules...")
        const buffer = await readTextFile(subModulesFile);
        log.info("grokking paths of local submodules...");
        const lines = buffer.split("\n");
        const submodulePaths = lines.reduce((acc: string[], cur: string) => {
            const parts = cur.split(" = ")
                .map(item => item.trim());
            if (parts.length > 1 && parts[0] === "path") {
                acc.push(parts[1]);
            }
            return acc;
        }, [] as string[]);
        for (const dir of submodulePaths) {
            await mkdir(dir);
        }
        log.info("making sure local submodules are up to date...");
        for (const mod of submodulePaths) {
            const workingFolder = path.join(process.cwd(), mod);
            log.info(`working with submodule at: ${ mod }`);
            log.debug("- fetch changes");
            const opts = { cwd: workingFolder } as SystemOptions;
            await system("git", [ "fetch " ], opts);
            await system("git", [ "checkout", "master" /* TODO: cater for 'main' */ ], opts);
            log.debug("- fast-forward to head");
            await system("git", [ "rebase" ], opts);
        }
        log.info("git submodule magick complete");
    });
})();
