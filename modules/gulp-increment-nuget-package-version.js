"use strict";
(function () {
    const env = requireModule("env"), gutil = requireModule("gulp-util"), debug = requireModule("debug")(__filename), editXml = require("gulp-edit-xml"), incrementVersion = requireModule("./increment-version"), ZarroError = requireModule("zarro-error"), xmlOpts = {
        builderOptions: {
            renderOpts: {
                pretty: true
            }
        }
    };
    // FIXME: proper types plz
    function incrementPackageVersionInCsProj(xml, file) {
        debug(JSON.stringify(xml, null, 2));
        const packageVersionPropGroup = xml.Project.PropertyGroup.filter((g) => !!g.PackageVersion)[0];
        if (!packageVersionPropGroup) {
            debug("No PropertyGroup found with PackageVersion node");
            return xml;
        }
        const node = packageVersionPropGroup.PackageVersion;
        const newVersion = incrementVersion(node[0], env.resolve("VERSION_INCREMENT_STRATEGY"), env.resolveFlag("VERSION_INCREMENT_ZERO"), env.resolveNumber("PACK_INCREMENT_VERSION_BY"), env.resolveFlag("BETA"));
        node[0] = newVersion;
        let packageIdPropGroup = xml.Project.PropertyGroup.filter((g) => !!g.PackageId)[0];
        let packageName = "(unknown)";
        if (!packageIdPropGroup) {
            if (!file) {
                throw new ZarroError([
                    `the installed version of gulp-edit-xml does not pass in the file being operated on.`,
                    `either:`,
                    `- update to the latest version`,
                    `  or`,
                    `- set the version to use "https://github.com/fluffynuts/gulp-edit-xml.git#pass-file-to-transform"`,
                    ` (if the update doesn't make this message go away)`
                ].join("\n"));
            }
            const filePath = file.history[0];
            packageIdPropGroup = xml.Project.PropertyGroup.filter((g) => !!g.AssemblyName)[0];
            if (!packageIdPropGroup) {
                debug({
                    file: JSON.stringify(file),
                    fileName: file.name,
                    stat: file.stat,
                    string: file.toString(),
                    hist: filePath
                });
                if (filePath) {
                    const parts = filePath.split(/[\\/]/);
                    debug({
                        parts
                    });
                    packageName = parts[parts.length - 2] || packageName;
                }
            }
            else {
                packageName = (packageIdPropGroup.AssemblyName[0] || packageName).trim();
            }
        }
        else {
            packageName = (packageIdPropGroup.PackageId[0] || packageName).trim();
        }
        gutil.log(gutil.colors.yellow(`${packageName}: package version incremented to: ${newVersion}`));
        debug({
            label: "final xml",
            doc: JSON.stringify(xml, null, 2)
        });
        return xml;
    }
    async function incrementPackageVersionInNuspec(xml, file) {
        const meta = xml.package.metadata[0], packageName = meta.id[0], node = meta.version, current = node[0];
        const newVersion = incrementVersion(current, env.resolve("VERSION_INCREMENT_STRATEGY"));
        node[0] = newVersion;
        gutil.log(gutil.colors.yellow(`${packageName}: package version incremented to: ${newVersion}`));
        return xml;
    }
    function incrementPackageVersion() {
        return editXml((xml, file) => {
            if (xml.package) {
                return incrementPackageVersionInNuspec(xml, file);
            }
            else if (xml.Project) {
                return incrementPackageVersionInCsProj(xml, file);
            }
            throw new ZarroError(`Don't know how to increment package version in document:\n\n${JSON.stringify(xml)}`);
        }, xmlOpts);
    }
    module.exports = {
        incrementPackageVersion
    };
})();
