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
["clean-tools-folder"],
() => {
  return installLocalTools.install(tools);
});

gulp.task("clean-tools-folder", () => {
  return installLocalTools.clean();
});