const
  gulp = requireModule<GulpWithHelp>("gulp-with-help"),
  taskName = "increment-package-json-version",
  filenameEnvVar = "PACKAGE_JSON",
  strategyVar = "VERSION_INCREMENT_STRATEGY",
  zeroVar = "VERSION_INCREMENT_ZERO",
  dryRunVar = "DRY_RUN",
  stat = requireModule<StatFunction>("stat"),
  readTextFile = requireModule<ReadTextFile>("read-text-file"),
  writeTextFile = requireModule<WriteTextFile>("write-text-file"),
  incrementVersion = requireModule<IncrementVersion>("increment-version"),
  env = requireModule<Env>("env");

env.associate([dryRunVar, filenameEnvVar, strategyVar, zeroVar], taskName);

function guessIndent(text: string) {
  const
    lines = text.split("\n"),
    firstIndented = lines.find(line => line.match(/^\s+/));
  if (!firstIndented) {
    return 2; // guess
  }
  const
    firstMatch = firstIndented.match(/(^\s+)/) || [],
    leadingWhitespace = firstMatch[0] || "  ",
    asSpaces = leadingWhitespace.replace(/\t/g, "  ");
  return asSpaces.length;
}

gulp.task("increment-package-json-version", () => {
  return new Promise(async (resolve, reject) => {
    const
      packageJson = env.resolve(filenameEnvVar),
      st = await stat(packageJson);
    if (!st) {
      return reject(`Can't find file at '${ packageJson }'`);
    }
    const
      dryRun = env.resolveFlag(dryRunVar),
      strategy = env.resolve(strategyVar),
      zero = env.resolveFlag(zeroVar),
      json = await readTextFile(packageJson),
      indent = guessIndent(json),
      index = JSON.parse(json),
      currentVersion = index.version || "0.0.0",
      incremented = incrementVersion(currentVersion, strategy, zero);
    index.version = incremented;
    const newJson = JSON.stringify(index, null, indent);
    if (dryRun) {
      console.log(`Would increment version in '${ packageJson }' from '${ currentVersion }' to '${ incremented }'`);
    }
    await writeTextFile(packageJson, newJson);
    resolve();
  });
});
