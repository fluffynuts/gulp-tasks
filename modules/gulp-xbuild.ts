import { BufferFile } from "vinyl";
import { Stream } from "stream";

(function() {
    const
        quoteIfRequired = requireModule<QuoteIfRequired>("quote-if-required"),
        system = requireModule<System>("system"),
        defaultOptions = {
            noConsoleLogger: false,
            target: [ "build" ],
            configuration: "Debug",
            verbosity: "minimal",
            platform: "Any CPU",
            nologo: false
        },
        gutil = requireModule<GulpUtil>("gulp-util"),
        es = require("event-stream");

    function gulpXBuild(options: any) {
        options = { ...defaultOptions, ...options };
        const args = prepareArgsFrom(options);
        const promise = Promise.resolve();
        return es.through(
            function write(file: BufferFile) {
                promise.then(() =>
                                 buildWithXBuild(
                                     file.path,
                                     args
                                 )
                );
            },
            async function end(this: Stream) {
                try {
                    await promise;
                    this.emit("end");
                } catch (e) {
                    this.emit("error", e);
                }
            }
        );
    }

    function prepareArgsFrom(options: GulpXBuildOptions) {
        const args = [];
        if (options.noConsoleLogger) {
            args.push("/noconsolelogger");
        }
        if (!Array.isArray(options.target)) {
            options.target = [ options.target ];
        }
        args.push(`/target:${ options.target.join(",") }`);
        args.push(`/p:configuration=${ options.configuration }`);
        args.push(`/verbosity:${ options.verbosity }`);
        args.push(`/p:platform=${ options.platform }`);
        if (options.nologo) {
            args.push("/nologo");
        }
        return args.map(quoteIfRequired);
    }

    function buildWithXBuild(
        solutionFile: string,
        args: string[]
    ) {
        gutil.log(gutil.colors.green(`XBuild ${ solutionFile }`));
        return system("xbuild", args.concat(solutionFile));
    }

    module.exports = gulpXBuild;
})();
