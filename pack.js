const getToolsFolder = requireModule("get-tools-folder"),
  path = require("path"),
  throwIfNoFiles = requireModule("throw-if-no-files"),
  dotnetCli = require("gulp-dotnet-cli"),
  dotnetPack = dotnetCli.pack,
  { incrementPackageVersion } = requireModule(
    "gulp-increment-nuget-package-version"
  ),
  resolveMasks = requireModule("resolve-masks"),
  env = requireModule("env"),
  fs = requireModule("fs"),
  { rewriteFile } = requireModule("rewrite-file"),
  del = require("del"),
  debug = require("debug")("pack"),
  gulp = requireModule("gulp"),
  { pack } = requireModule("gulp-nuget-pack");

env.associate(
  [
    "PACKAGE_TARGET_FOLDER",
    "DOTNET_CORE",
    "PACK_INCLUDE_CSPROJ",
    "PACK_EXCLUDE_CSPROJ",
    "PACK_INCLUDE_NUSPEC",
    "PACK_EXCLUDE_NUSPEC",
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

function removeBadEntities(buffer) {
  const
    s = buffer.toString().replace(/&#xD;/g, "");
  return Buffer.from(s);
}

function packWithNuget(target, incrementVersion) {
  const nuspecs = resolveMasks(
    "PACK_INCLUDE_NUSPEC",
    "PACK_EXCLUDE_NUSPEC",
    p => (p || "").match(/\.nuspec$/) ? p : `${p}.nuspec`
  );
  let stream = gulp
    .src(nuspecs, `!${getToolsFolder()}/**/*`)
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

function packWithDotnetCore(target, incrementVersion) {
  const projects = resolveMasks("PACK_INCLUDE_CSPROJ", "PACK_EXCLUDE_CSPROJ", p => {
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
    stream = stream
      .pipe(incrementPackageVersion())
      .pipe(rewriteFile(removeBadEntities));
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
    return Promise.resolve();
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
