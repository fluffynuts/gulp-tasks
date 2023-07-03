(function() {
  const
    gulp = requireModule<Gulp>("gulp");

  gulp.task("start-dev-smtp-server", async () => {
    const
      spawn = requireModule<Spawn>("spawn"),
      mailpitBinary = await downloadMailPitToToolsFolder();
  });

  async function downloadMailPitToToolsFolder(): Promise<Optional<string>> {
    const
      os = require("os"),
      { redBright } = requireModule<AnsiColors>("ansi-colors"),
      { ls } = require("yafs"),
      path = require("path"),
      getToolsFolder = requireModule<GetToolsFolder>("get-tools-folder"),
      { fetchLatestRelease } = require("fetch-github-release");

    const target = path.join(getToolsFolder(), "mailpit");
    await fetchLatestRelease({
      owner: "axllent",
      repo: "mailpit",
      destination: target,
      shouldExtract: true
    });
    const
      contents = await ls(target, { fullPaths: true });

    const seek = os.platform() === "win32"
      ? "mailpit.exe"
      : "mailpit";
    for (const item of contents) {
      const fn = path.basename(item);
      if (fn.toLowerCase() === seek) {
        return item;
      }
    }

    console.error(
      redBright(`Unable to find mailpit binary under ${ target }`)
    );
    return undefined;
  }
})();
