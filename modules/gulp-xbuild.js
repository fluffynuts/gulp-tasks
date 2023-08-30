"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const quoteIfRequired = requireModule("quote-if-required"), system = requireModule("system"), defaultOptions = {
        noConsoleLogger: false,
        target: ["build"],
        configuration: "Debug",
        verbosity: "minimal",
        platform: "Any CPU",
        nologo: false
    }, gutil = requireModule("gulp-util"), es = require("event-stream");
    function gulpXBuild(options) {
        options = Object.assign(Object.assign({}, defaultOptions), options);
        const args = prepareArgsFrom(options);
        const promise = Promise.resolve();
        return es.through(function write(file) {
            promise.then(() => buildWithXBuild(file.path, args));
        }, async function end() {
            try {
                await promise;
                this.emit("end");
            }
            catch (e) {
                this.emit("error", e);
            }
        });
    }
    function prepareArgsFrom(options) {
        const args = [];
        if (options.noConsoleLogger) {
            args.push("/noconsolelogger");
        }
        if (!Array.isArray(options.target)) {
            options.target = [options.target];
        }
        args.push(`/target:${options.target.join(",")}`);
        args.push(`/p:configuration=${options.configuration}`);
        args.push(`/verbosity:${options.verbosity}`);
        args.push(`/p:platform=${options.platform}`);
        if (options.nologo) {
            args.push("/nologo");
        }
        return args.map(quoteIfRequired);
    }
    function buildWithXBuild(solutionFile, args) {
        gutil.log(gutil.colors.green(`XBuild ${solutionFile}`));
        return system("xbuild", args.concat(solutionFile));
    }
    module.exports = gulpXBuild;
})();
