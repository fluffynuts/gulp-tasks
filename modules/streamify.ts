import * as through from "through2";
import { Transform } from "stream";
import * as vinyl from "vinyl";
import PluginError from "plugin-error";

(function() {
  const through = require("through2");
  const PluginError = require("plugin-error");

  function streamify<T>(
    fn: AsyncTVoid<T>,
    optionsFactory: OptionsFactory<T>,
    pluginName: string,
    operation: string
  ): Transform {
    return through.obj(async function(
      this: Transform,
      file: vinyl.BufferFile,
      enc: string,
      cb: (err: PluginError | null, file: vinyl.BufferFile) => void
    ) {
      try {
        const options = await optionsFactory(file);
        await fn(options);
        cb(null, file);
      } catch (e: unknown) {
        const pluginError = new PluginError(pluginName, `${operation} failed: ${ (e as Error).message || e }`);
        this.emit("error", pluginError);
        cb(pluginError, file);
      }
    })
  }
  module.exports = {
    streamify
  };
})();
