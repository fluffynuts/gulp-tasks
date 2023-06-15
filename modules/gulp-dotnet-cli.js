"use strict";
(function () {
    const dotnetCli = requireModule("dotnet-cli");
    const { streamify } = requireModule("streamify");
    const env = requireModule("env");
    const path = require("path");
    const { fileExists } = require("yafs");
    function wrap(fn) {
        return async (opts) => {
            const result = await fn(opts);
            if (result instanceof Error) {
                throw result;
            }
            // otherwise, discard the result
        };
    }
    function pack(opts) {
        return streamify(wrap(dotnetCli.pack), async (f) => {
            const copy = Object.assign({}, opts);
            copy.target = f.path;
            const containingFolder = path.dirname(f.path);
            const supplementaryNuspec = path.resolve(path.join(containingFolder, env.resolve(env.PACK_SUPPLEMENTARY_NUSPEC)));
            if (await fileExists(supplementaryNuspec)) {
                copy.nuspec = supplementaryNuspec;
            }
            return copy;
        }, "gulp-dotnet-cli-pack", "creating nuget package");
    }
    function build(opts) {
        return streamify(wrap(dotnetCli.build), f => {
            const copy = Object.assign({}, opts);
            copy.target = f.path;
            return copy;
        }, "gulp-dotnet-cli-build", "building project or solution");
    }
    function test(opts) {
        return streamify(wrap(dotnetCli.test), f => {
            const copy = Object.assign({}, opts);
            copy.target = f.path;
            return copy;
        }, "gulp-dotnet-cli-pack", "creating nuget package");
    }
    function nugetPush(opts) {
        return streamify(wrap(dotnetCli.nugetPush), f => {
            const copy = Object.assign({}, opts);
            copy.target = f.path;
            return copy;
        }, "gulp-dotnet-cli-nuget-push", "pushing nuget package");
    }
    module.exports = {
        build,
        test,
        pack,
        nugetPush
    };
})();
