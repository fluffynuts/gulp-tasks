import { Stream, Transform } from "stream";
import { BufferFile } from "vinyl";

(function() {
    const
        es = require("event-stream"),
        multiSplit = requireModule<MultiSplit>("multi-split"),
        debug = requireModule<DebugFactory>("debug")(__filename);

    function findBuildConfigFrom(pathParts: string[]) {
        const oneUp = pathParts[pathParts.length - 2];
        if (oneUp === undefined) {
            return "";
        }
        if (oneUp.match(/^net(standard\d\.\d|\d{3}|coreapp\d\.\d)$/)) {
            // one-up is a release target... travel one higher
            return pathParts[pathParts.length - 3] || "";
        }
        return oneUp;
    }

    module.exports = function generateFilter(
        configuration: string
    ): Transform {
        return es.through(function write(
            this: Stream,
            file: BufferFile
        ) {
           if (isNetFxAssembly(file.path)) {
               this.emit("data", file);
           }
        }, function end(this: Stream) {
            this.emit("end");
        });

        function isNetFxAssembly(file: string): boolean {
            const parts = multiSplit(file, [ "/", "\\" ]),
                isNetCore = !!parts.filter(p => p.match(/^netcore/)).length,
                assemblyName = parts[parts.length - 1].replace(/\.dll$/gi, ""),
                isPrimary = !!parts
                    .slice(0, parts.length - 1)
                    .filter(p => p.toLowerCase() === assemblyName.toLowerCase()).length,
                isBin = !!parts.filter(p => p.match(/^bin$/i)).length,
                buildConfig = findBuildConfigFrom(parts),
                isDebug = buildConfig.toLowerCase() === "debug",
                isForConfig = buildConfig.toLowerCase() === configuration.toLowerCase(),
                isAny = (parts[parts.length - 1] || "").toLowerCase() === "bin",
                include = !isNetCore && isPrimary && isBin && (isDebug || isAny || isForConfig);
            debug({
                      file,
                      parts,
                      buildConfig,
                      isNetCore,
                      isPrimary,
                      isDebug,
                      isAny,
                      isBin,
                      isForConfig,
                      include
                  });
            return include;
        }
    };
})();
