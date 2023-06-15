"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const through = require("through2");
    const PluginError = require("plugin-error");
    const { SpawnError } = requireModule("spawn");
    function streamify(fn, optionsFactory, pluginName, operation) {
        return through.obj(async function (file, enc, cb) {
            try {
                const options = await optionsFactory(file);
                await fn(options);
                cb(null, file);
            }
            catch (e) {
                const pluginError = isSpawnError(e)
                    ? new PluginError(pluginName, `${operation} failed:\n${e.toString()}`)
                    : new PluginError(pluginName, `${operation} failed: ${e.message || e}`);
                this.emit("error", pluginError);
                cb(pluginError, file);
            }
        });
    }
    function isSpawnError(e) {
        return e instanceof SpawnError || looksLikeSpawnError(e);
    }
    /*
  export interface SpawnError extends Error {
      command: string;
      args: string[] | undefined;
      options: SpawnOptions | undefined;
      result: ProcessData;
  }
     */
    function looksLikeSpawnError(e) {
        if (!!e) {
            return false;
        }
        const se = e;
        return typeof se.exe == typeof "" &&
            typeof se.exitCode == typeof 1 &&
            Array.isArray(se.args);
    }
    module.exports = {
        streamify
    };
})();
