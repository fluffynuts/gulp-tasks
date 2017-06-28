const
  gulp = requireModule("gulp-with-help"),
  installLocalTools = requireModule("install-local-tools"),
  tools = [
    "nunit.console",
    "opencover",
    "reportgenerator"
  ];

gulp.task("default-tools-installer",
`Installs the default toolset: ${tools.join(", ")}`, 
() => {
  return installLocalTools.install(tools);
});

gulp.task("clean-tools-folder", 
 "Cleans out folders under the tools folder (will always be done as part of tool installation)",
 () => {
  return installLocalTools.clean();
});