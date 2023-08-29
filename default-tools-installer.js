"use strict";
(function () {
    const debug = requireModule("debug")("default-tools-installer"), gulp = requireModule("gulp"), env = requireModule("env"), nugetSourceName = process.env.NUGET_SOURCE || "nuget.org", installLocalTools = requireModule("install-local-tools"), isDotnetCore = env.resolveFlag("DOTNET_CORE"), tools = isDotnetCore
        ? [] // currently, only dotnet targets are used for dotnet test/build
        : [
            `${nugetSourceName}/nunit.console`,
            `${nugetSourceName}/opencover`,
            `${nugetSourceName}/Jetbrains.dotCover.CommandLineTools`,
            `${nugetSourceName}/reportgenerator`
        ];
    env.associate("default-tools-installer", ["BUILD_TOOLS_FOLDER", "DOTNET_CORE"]);
    gulp.task("default-tools-installer", `Installs the default toolset: ${tools.join(", ")}`, () => {
        if (env.resolveFlag("DOTNET_CORE")) {
            debug("not invoked for dotnet core builds");
            return Promise.resolve();
        }
        return installLocalTools.install(tools);
    });
    gulp.task("clean-tools-folder", "Cleans out folders under the tools folder (will always be done as part of tool installation)", () => {
        return installLocalTools.clean();
    });
})();
