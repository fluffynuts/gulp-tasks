const
  gulp = requireModule("gulp-with-help"),
  install = requireModule("install-local-tools")
  tools = [
    "nunit.console",
    "opencover",
    "reportgenerator"
  ];

gulp.task("default-tools-installer",
`Installs the default toolset: ${tools.join(", ")}`, () => {
  return install(tools);
});
