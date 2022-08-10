export interface AlterPackageJsonVersionOptions {
  packageJsonPath?: string;
  dryRun?: boolean;
  strategy?: string;
  zero?: boolean;
  loadUnsetFromEnvironment?: boolean;
  incrementBy?: number
}

interface CompleteOptions extends AlterPackageJsonVersionOptions {
  packageJsonPath: string;
  dryRun: boolean;
  strategy: string;
  zero: boolean;
  incrementBy: number
}

(function() {
  const
    gutil = requireModule<GulpUtil>("gulp-util"),
    env = requireModule<Env>("env"),
    { stat } = require("fs").promises,
    readTextFile = requireModule<ReadTextFile>("read-text-file"),
    writeTextFile = requireModule<WriteTextFile>("write-text-file"),
    incrementVersion = requireModule<IncrementVersion>("increment-version");

  async function alterPackageJsonVersion(
    inputOpts?: AlterPackageJsonVersionOptions
  ) {
    if (env.resolveFlag(env.INITIAL_RELEASE)) {
      return;
    }
    return new Promise<void>(async (resolve, reject) => {
      const
        opts = fillInFromEnvironment(inputOpts),
        st = await stat(opts.packageJsonPath);
      if (!st) {
        return reject(`Can't find file at '${ opts.packageJsonPath }'`);
      }
      const
        json = await readTextFile(opts.packageJsonPath),
        indent = guessIndent(json),
        index = JSON.parse(json),
        currentVersion = index.version || "0.0.0",
        incremented = incrementVersion(
          currentVersion,
          opts.strategy,
          opts.zero,
          opts.incrementBy
        );
      index.version = incremented;
      const newJson = JSON.stringify(index, null, indent);
      if (opts.dryRun) {
        gutil.log(
          gutil.colors.green(
            `dry run: would increment version in '${ opts.packageJsonPath }' from '${ currentVersion }' to '${ incremented }'`
          )
        );
      }
      await writeTextFile(opts.packageJsonPath, newJson);
      resolve();
    });
  }

  function shouldFillInFromEnvironment(opts?: AlterPackageJsonVersionOptions) {
    if (!opts) {
      return true;
    }
    if (opts.loadUnsetFromEnvironment) {
      return true;
    }
    return (Object.keys(opts).length === 0);
  }

  function fillInFromEnvironment(opts?: AlterPackageJsonVersionOptions): CompleteOptions {
    if (!shouldFillInFromEnvironment(opts)) {
      return opts as CompleteOptions;
    }
    const result = { ...opts } as CompleteOptions;
    if (result.packageJsonPath === undefined) {
      result.packageJsonPath = env.resolve(env.PACKAGE_JSON);
    }
    if (result.dryRun === undefined) {
      result.dryRun = env.resolveFlag(env.DRY_RUN)
    }
    if (result.strategy === undefined) {
      result.strategy = env.resolve(env.VERSION_INCREMENT_STRATEGY);
    }
    if (result.zero === undefined) {
      result.zero = env.resolveFlag(env.VERSION_INCREMENT_ZERO);
    }
    if (result.incrementBy === undefined) {
      result.incrementBy = env.resolveNumber(env.PACK_INCREMENT_VERSION_BY);
    }
    return result as CompleteOptions;
  }

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

  module.exports = alterPackageJsonVersion;
})();
