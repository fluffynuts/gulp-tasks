const getToolsFolder = requireModule("get-tools-folder"),
  path = require("path"),
  throwIfNoFiles = requireModule("throw-if-no-files"),
  dotnetCli = require("gulp-dotnet-cli"),
  dotnetPack = dotnetCli.pack,
  incrementPackageVersion = requireModule(
    "gulp-increment-nuget-package-version"
  ),
  resolveMasks = requireModule("resolve-masks"),
  env = requireModule("env"),
  fs = requireModule("fs"),
  rewriteFile = requireModule("rewrite-file"),
  del = require("del"),
  debug = require("debug")("pack"),
  gulp = requireModule("gulp-with-help"),
  pack = requireModule("gulp-nuget-pack");

env.associate(
  [
    "PACKAGE_TARGET_FOLDER",
    "DOTNET_CORE",
    "PACK_INCLUDE",
    "PACK_EXCLUDE",
    "PACK_INCREMENT_VERSION"
  ],
  ["pack"]
);

gulp.task(
  "pack",
  "Creates nupkgs from all nuspec files in this repo",
  ["prepack"],
  () => {
    const target = env.resolve("PACKAGE_TARGET_FOLDER"),
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

function packWithNuget(target, incrementVersion) {
  let stream = gulp
    .src(["**/*.nuspec", `!${getToolsFolder()}/**/*`])
    .pipe(throwIfNoFiles("No nuspec files found"));
  if (incrementVersion) {
    stream = stream.pipe(incrementPackageVersion()).pipe(rewriteFile());
  }
  return stream.pipe(pack()).pipe(target);
}

function packWithDotnetCore(target, incrementVersion) {
  const projects = resolveMasks("PACK_INCLUDE", "PACK_EXCLUDE", p => {
    return (p || "").match(/\.csproj$/) ? p : `${p}.csproj`;
  });
  const configuration = env.resolve("PACK_CONFIGURATION");
  debug({
    projects,
    configuration
  });
  let stream = gulp
    .src(projects, `!${getToolsFolder()}/**/*`)
    .pipe(
      throwIfNoFiles(
        "No target projects found to pack; check PACK_INCLUDE / PACK_EXCLUDE"
      )
    );
  if (incrementVersion) {
    stream = stream.pipe(incrementPackageVersion()).pipe(rewriteFile());
  }
  return stream.pipe(
    dotnetPack({
      output: path.resolve(target),
      configuration
    })
  );
}

gulp.task(
  "prepack",
  "Skeleton task which you can replace to run logic just before packing",
  () => {
    if (env.resolveFlag("DOTNET_CORE")) {
      return Promise.resolve();
    }
    return gulp.series("build");
  }
);

gulp.task(
  "clean-packages",
  "Removes any existing package artifacts",
  async () => {
    const packageFolder = process.env.PACKAGE_TARGET_FOLDER || "packages";
    await del(packageFolder);
    await fs.ensureDirectoryExists(packageFolder);
  }
);
