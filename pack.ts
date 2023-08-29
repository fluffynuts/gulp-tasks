(function() {
    const
        getToolsFolder = requireModule<GetToolsFolder>("get-tools-folder"),
        path = require("path"),
        throwIfNoFiles = requireModule<TransformFunction<string>>("throw-if-no-files"),
        { incrementPackageVersion } = requireModule<GulpIncrementNugetPackageVersion>(
            "gulp-increment-nuget-package-version"
        ),
        resolveMasks = requireModule<ResolveMasks>("resolve-masks"),
        env = requireModule<Env>("env"),
        { rewriteFile } = requireModule<RewriteFile>("rewrite-file"),
        del = require("del"),
        debug = require("debug")("pack"),
        gulp = requireModule<Gulp>("gulp"),
        { mkdir } = require("yafs");

    env.associate(
        [
            "PACK_TARGET_FOLDER",
            "DOTNET_CORE",
            "PACK_INCLUDE_CSPROJ",
            "PACK_EXCLUDE_CSPROJ",
            "PACK_INCLUDE_NUSPEC",
            "PACK_EXCLUDE_NUSPEC",
            "PACK_INCREMENT_VERSION",
            "PACK_NO_BUILD",
            "PACK_NO_RESTORE",
            "BETA",
            "PACK_VERBOSITY",
            "PACK_INCLUDE_SOURCE",
            "PACK_INCLUDE_SYMBOLS",
            "PACK_SUPPLEMENTARY_NUSPEC",
            "PACK_VERSION"
        ],
        [ "pack" ]
    );

    gulp.task(
        "pack",
        "Creates nupkgs from all nuspec files in this repo",
        [ "prepack" ],
        () => {
            const target = env.resolve("PACK_TARGET_FOLDER"),
                isDotnetCore = env.resolveFlag("DOTNET_CORE"),
                incrementVersion = env.resolveFlag("PACK_INCREMENT_VERSION"),
                packerFn = isDotnetCore ? packWithDotnetCore : packWithNuget;
            debug({
                      isDotnetCore,
                      incrementVersion
                  });
            return packerFn(target, incrementVersion);
        }
    );

    function removeBadEntities(buffer: Buffer): Buffer {
        const
            s = buffer.toString().replace(/&#xD;/g, "");
        return Buffer.from(s);
    }

    function packWithNuget(
        target: string,
        incrementVersion: boolean
    ) {
        const { pack } = requireModule<GulpNugetPack>("gulp-nuget-pack");
        const nuspecs = resolveMasks(
            "PACK_INCLUDE_NUSPEC",
            "PACK_EXCLUDE_NUSPEC",
            p => (p || "").match(/\.nuspec$/) ? p : `${ p }.nuspec`
        );
        let stream = gulp
            .src(nuspecs.concat([ `!${ getToolsFolder() }/**/*` ]))
            .pipe(throwIfNoFiles("No nuspec files found"));
        if (incrementVersion) {
            stream = stream
                .pipe(incrementPackageVersion())
                .pipe(rewriteFile(removeBadEntities));
        }
        return stream
            .pipe(pack())
            .pipe(gulp.dest(target));
    }

    function packWithDotnetCore(
        target: string,
        incrementVersion: boolean
    ) {
        const {
            pack
        } = requireModule<GulpDotNetCli>("gulp-dotnet-cli");
        const projects = resolveMasks("PACK_INCLUDE_CSPROJ", "PACK_EXCLUDE_CSPROJ", p => {
            return (p || "").match(/\.csproj$/) ? p : `${ p }.csproj`;
        });
        const
            configuration = env.resolve("PACK_CONFIGURATION");
        debug({
                  projects,
                  configuration
              });
        let stream = gulp
            .src(projects.concat([ `!${ getToolsFolder() }/**/*` ]))
            .pipe(
                throwIfNoFiles(
                    "No target projects found to pack; check PACK_INCLUDE / PACK_EXCLUDE"
                )
            );
        if (incrementVersion) {
            stream = stream
                .pipe(incrementPackageVersion())
                .pipe(rewriteFile(removeBadEntities));
        }

        const packConfig: DotNetPackOptions = {
            target: "[not set]",
            output: path.resolve(target),
            configuration,
            noBuild: env.resolveFlag("PACK_NO_BUILD"),
            noRestore: env.resolveFlag("PACK_NO_RESTORE"),
            verbosity: env.resolve("PACK_VERBOSITY") as DotNetVerbosity,
            includeSource: env.resolveFlag("PACK_INCLUDE_SOURCE"),
            includeSymbols: env.resolveFlag("PACK_INCLUDE_SYMBOLS"),
            nuspec: env.resolve("PACK_SUPPLEMENTARY_NUSPEC"),
            versionSuffix: env.resolve("PACK_VERSION")
        };
        if (process.env["PACK_VERSION"] !== undefined) {
            packConfig.versionSuffix = process.env["PACK_VERSION"];
        }
        return stream.pipe(
            pack(packConfig)
        );
    }

    gulp.task(
        "prepack",
        "Skeleton task which you can replace to run logic just before packing",
        () => {
            return Promise.resolve();
        }
    );

    gulp.task(
        "clean-packages",
        "Removes any existing package artifacts",
        async () => {
            const packageFolder = env.resolve("PACK_TARGET_FOLDER");
            await del(packageFolder);
            await mkdir(packageFolder);
        }
    );
})();
