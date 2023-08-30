(function() {
    const
        system = requireModule<System>("system"),
        debug = require("debug")("spawn-nuget"),
        findLocalNuget = require("./find-local-nuget");

    module.exports = async function(
        args: string[], opts?: SystemOptions
    ): Promise<SystemResult | SystemError> {
        const nuget = await findLocalNuget();
        debug(`spawn nuget: ${ nuget } ${ args.join(" ") }`);
        if (opts && Object.keys(opts).length) {
            debug(` nuget spawn options: ${ JSON.stringify(opts) }`);
        }
        return await system(nuget, args, opts);
    };
})();
