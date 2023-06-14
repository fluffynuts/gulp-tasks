"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const through = require("through2");
    const PluginError = require("plugin-error");
    function streamify(fn, optionsFactory, pluginName, operation) {
        return through.obj(async function (file, enc, cb) {
            try {
                const options = await optionsFactory(file);
                await fn(options);
                cb(null, file);
            }
            catch (e) {
                const pluginError = new PluginError(pluginName, `${operation} failed: ${e.message || e}`);
                this.emit("error", pluginError);
                cb(pluginError, file);
            }
        });
    }
    module.exports = {
        streamify
    };
})();
