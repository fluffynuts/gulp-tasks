const
  gulp = requireModule("gulp-with-help"),
  getToolsFolder = requireModule("get-tools-folder"),
  areAllDotnetCore = requireModule("are-all-dotnet-core"),
  nugetSourceName = process.env.NUGET_SOURCE || "nuget.org",
  installLocalTools = requireModule("install-local-tools"),
  env = requireModule("env"),
  tools = [
    `${nugetSourceName}/nunit.console`,
    `${nugetSourceName}/opencover`,
    `${nugetSourceName}/reportgenerator`
  ];

env.associate("default-tools-installer", "BUILD_TOOLS_FOLDER");

gulp.task("default-tools-installer",
`Installs the default toolset: ${tools.join(", ")}`,
async () => {
  const allDNC = await areAllDotnetCore([
    "**/*.csproj",
    "!**/node_modules/**/*.csproj",
    `!./${getToolsFolder()}/**/*.csproj`
  ]);
  return allDNC
    ? Promise.resolve()  // none of the default NETFramework tooling is useful for DNC yet
    : installLocalTools.install(tools);
});

gulp.task("clean-tools-folder",
 "Cleans out folders under the tools folder (will always be done as part of tool installation)",
 () => {
  return installLocalTools.clean();
});
