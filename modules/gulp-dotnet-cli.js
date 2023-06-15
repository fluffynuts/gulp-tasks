"use strict";
(function () {
    const dotnetCli = requireModule("dotnet-cli");
    const { streamify } = requireModule("streamify");
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
        return streamify(wrap(dotnetCli.pack), f => {
            const copy = Object.assign({}, opts);
            copy.target = f.path;
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
