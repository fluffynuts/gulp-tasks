var fs = require('fs'),
  path = require('path'),
  lsR = require('./ls-r'),
  log = require('./log'),
  confFile = 'karma.conf.js';

var KarmaUtils = function() {
};
KarmaUtils.prototype = {
    findGulpFolder: function(lookIn) {
        lookIn = lookIn || __dirname;
        var lookFor = path.join(lookIn, 'gulpfile.js');
        if (fs.existsSync(lookFor)) {
            return lookIn;
        }
        var next = path.dirname(lookIn);
        if (next === '.') {
            throw 'Can\'t find your gulpfile.js, traversing up from ' + __dirname;
        }
        return this.findGulpFolder(next);
    },
    findKarmaConfUnder: function(folder) {
        var conf = path.join(folder, confFile);
        if (fs.existsSync(conf)) {
            return conf;
        }
        var allFiles = lsR('.');
        var karmaConfs = allFiles.filter(function(path) {
          return path.toLowerCase().endsWith(confFile);
        });
        switch (karmaConfs.length) {
          case 0:
            throw `No ${confFile} found when traversing downward`;
          case 1:
            return karmaConfs[0].replace(/\\/g, '/');
          default:
            log.info('Multiple confs found: ' + karmaConfs.join(', '));
            throw `Multiple instances of ${confFile} not supported (yet)`;
        }
    },
    findKarmaConf: function() {
        var gulpFolder = this.findGulpFolder();
        return this.findKarmaConfUnder(gulpFolder);
    },
    findCoverageOutputFolder: function(karmaConf) {
        karmaConf = karmaConf || this.findKarmaConf();
        // strip .js suffix if it exists
        karmaConf = karmaConf.replace(/\.js$/, '');
        try {
            var conf = require(karmaConf);
            var options = {};
            var fake = {
                'set': function(configuredOptions) {
                    options = configuredOptions;
                }
            };
            conf(fake);
            if (options.coverageReporter && options.coverageReporter.dir) {
                return options.coverageReporter.dir;
            }
            return null;
        } catch (e) {
            log.error(e);
            return null;
        }
    },
    rmdir: function(dir) {
        if (!dir) {
            return;
        }
        if (!fs.existsSync(dir)) {
            return;
        }
    	var list = fs.readdirSync(dir);
    	for(var i = 0; i < list.length; i++) {
    		var filename = path.join(dir, list[i]);
    		var stat = fs.statSync(filename);

    		if(filename == "." || filename == "..") {
    			// pass these files
    		} else if(stat.isDirectory()) {
    			// rmdir recursively
    			this.rmdir(filename);
    		} else {
    			// rm fiilename
    			fs.unlinkSync(filename);
    		}
    	}
    	fs.rmdirSync(dir);
    },
    moveCoverageUpToParentFolderIfPossible: function() {
        var coverageOutputFolder = this.findCoverageOutputFolder();
        if (!coverageOutputFolder) {
          return;
        }
        var parts = coverageOutputFolder.split('/');
        var canMoveUp = parts.length > 1;
        var coverageOutputExists = fs.existsSync(coverageOutputFolder);
        if (coverageOutputExists && canMoveUp) {
            var contents = fs.readdirSync(coverageOutputFolder);
            if (contents.length === 1) {
                var theFolder = contents[0];
                log.notice(['moving single javascript coverage result from "',
                                path.join(coverageOutputFolder, theFolder),
                                '" to "',
                                coverageOutputFolder].join(''));
                contents = fs.readdirSync(path.join(coverageOutputFolder, contents[0]))
                contents.forEach(function(item) {
                    var oneUp = path.join(coverageOutputFolder, item);
                    var fullPath = path.join(coverageOutputFolder, theFolder, item);
                    fs.renameSync(fullPath, oneUp);
                })
            }
        }
    }
};

module.exports = new KarmaUtils;
