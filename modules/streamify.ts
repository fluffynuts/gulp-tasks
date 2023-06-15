import { Transform } from "stream";
import * as vinyl from "vinyl";

(function() {
  const through = require("through2");
  const PluginError = require("plugin-error");
  const { SpawnError } = requireModule<Spawn>("spawn");

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
        const pluginError = isSpawnError(e)
          ? new PluginError(pluginName, `${ operation } failed:\n${ e.toString() }`)
          : new PluginError(pluginName, `${ operation } failed: ${ (e as Error).message || e }`);
        this.emit("error", pluginError);
        cb(pluginError, file);
      }
    })
  }

  function isSpawnError(e: unknown): e is SpawnError {
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
  function looksLikeSpawnError(e: unknown): e is SpawnError {
    if (!!e) {
      return false;
    }
    const se = e as SpawnError;
    return typeof se.exe == typeof "" &&
      typeof se.exitCode == typeof 1 &&
      Array.isArray(se.args)
  }

  module.exports = {
    streamify
  };
})();
