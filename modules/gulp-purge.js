"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const gutil = requireModule("gulp-util");
    const es = require("event-stream");
    const { folderExistsSync, rmSync } = require("yafs");
    const log = requireModule("log");
    const PLUGIN_NAME = "gulp-purge";
    let DEBUG = false;
    // theoretically, one should be able to use vinyl-paths and
    // del to accomplish this; however, that mechanism was failing
    // (SILENTLY!) because nunit-agent was still locking some of the
    // files. This tells you what actually happens and has a dryRun
    // feature for testing your input pipes
    function purge(options) {
        options = options || {};
        DEBUG = options.debug || false;
        if (DEBUG) {
            log.setThreshold(log.LogLevels.Debug);
        }
        const toRemove = [];
        const stream = es.through(function write(file) {
            if (!file) {
                fail(stream, "file may not be empty or undefined");
            }
            const filePath = file.history[0].replace(/\\/g, "/");
            if (!folderExistsSync(filePath)) {
                toRemove.push(filePath);
            }
            this.emit("data", file);
        }, function end() {
            try {
                deleteFiles(this, toRemove, options);
            }
            catch (e) {
                fail(this, e);
            }
        });
        return stream;
    }
    function fail(stream, msg) {
        stream.emit("error", new gutil.PluginError(PLUGIN_NAME, msg));
    }
    function end(stream) {
        stream.emit("end");
    }
    function deleteFiles(stream, toRemove, options) {
        const doLog = DEBUG || options.dryRun;
        if (doLog) {
            if (toRemove.length) {
                log.debug(`attempting to purge ${toRemove.length} files`);
            }
            else {
                log.debug("nothing to purge");
            }
        }
        else if (toRemove.length === 0) {
            log.info(" -> nothing to purge");
        }
        const errors = [];
        toRemove.forEach(function (path) {
            try {
                if (options.dryRun) {
                    log.debug("del: " + path);
                }
                else {
                    rmSync(path);
                }
            }
            catch (e) {
                if (options.stopOnErrors) {
                    log.error("Unable to delete file: " + path);
                    log.error(e);
                    fail(stream, `delete fails, exiting because failOnErrors is ${options.stopOnErrors}`);
                }
                errors.push({ path: path, error: e });
            }
        });
        errors.forEach(function (e) {
            log.warn("Error deleting \"" + e.path + "\": " + e.error);
        });
        end(stream);
    }
    module.exports = purge;
})();
