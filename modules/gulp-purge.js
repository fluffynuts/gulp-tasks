'use strict';
var gutil = require('gulp-util');
var es = require('event-stream');
var fs = require('fs');
var q = require('q');
var log = require('./log');

var PLUGIN_NAME = 'gulp-purge';
var DEBUG = false;

// theoretically, one should be able to use vinyl-paths and
// del to accomplish this; however, that mechanism was failing
// (SILENTLY!) because nunit-agent was still locking some of the
// files. This tells you what actually happens and has a dryRun
// feature for testing your input pipes

var CWD = process.cwd();

function purge(options) {
    options = options || { }
    DEBUG = options.debug || false;

    var toRemove = [];

    var stream = es.through(function write(file) {
        if (!file) {
            fail(stream, 'file may not be empty or undefined');
        }
        var filePath = file.history[0].replace(/\\/g, '/');
        if (!fs.lstatSync(filePath).isDirectory()) {
            toRemove.push(filePath);
        }
        this.emit('data', file);
    }, function end() {
        try {
            deleteFiles(this, toRemove, options);
        } catch (e) {
            fail(this, e);
        }
    }); 
    return stream;
};

function fail(stream, msg) {
    stream.emit('error', new gutil.PluginError(PLUGIN_NAME, msg));
}
function end(stream) {
    stream.emit('end');
}

function deleteFiles(stream, toRemove, options) {
    var doLog = DEBUG || options.dryRun;
    if (doLog) {
        if (toRemove.length) {
            log.debug('attempting to purge ' + toRemove.length + ' files');
        } else {
            log.debug('nothing to purge');
        }
    } else if (toRemove.length === 0) {
        log.info(' -> nothing to purge');
    }
    var errors = [];
    toRemove.forEach(function(path) {
        if (!fs.existsSync(path)) {
            return; // already gone!
        }
        try {
            if (options.dryRun) {
                log.debug('del: ' + path);
            } else {
                fs.unlinkSync(path);
            }
        } catch(e) {
            if (options.stopOnErrors) {
                log.error('Unable to delete file: ' + path);
                log.error(e);
                fail('delete fails, exiting because failOnErrors is ' + options.failOnErrors);
            }
            errors.push({path: path, error: e});
        }
    });
    errors.forEach(function(e) {
        log.warning('Error deleting "' + e.path + '": ' + e.error);
    });
    end(stream);
}

module.exports = purge;
