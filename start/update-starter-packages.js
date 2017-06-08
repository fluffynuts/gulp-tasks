#!/usr/bin/env node
const
	path = require("path"),
	fs = require("fs"),
	ioOpts = {
		encoding: "utf-8"
	},
	log = function() {
		try {
			console.log.apply(console, Array.from(arguments));
			return true;
		} catch (e) {
			return false;
		}
	},
	srcFile = "package.json",
	srcPath = path.join(path.dirname(__dirname), srcFile),
	targetPath = path.join(__dirname, "start", srcFile),
	checkExists = function (p) {
		if (fs.existsSync(p)) {
			return true;
		}
		throw new Error(`Unable to find expected file at ${p}`);
	},
	filesExist = checkExists(srcPath) && checkExists(targetPath),
	readJson = function (p) {
		return JSON.parse(fs.readFileSync(p, ioOpts.encoding));
	},
	srcConfig = readJson(srcPath),
	targetConfig = readJson(targetPath),
	updateKeys = function (src, target) {
		var updated = 0;
		Object.keys(src).forEach(k => {
			if (!target[k] || target[k] === src[k]) {
				return;
			}
			log(`${k}: ${target[k]} -> ${src[k]}`);
			target[k] = src[k];
			updated++;
		});
		return updated;
	},
	updateConfigSection = function (srcConfig, targetConfig, section) {
		const
			srcSection = srcConfig[section] || {},
			targetSection = targetConfig[section] || {};
		return updateKeys(srcSection, targetSection);
	},
	updated = ["dependencies", "devDependencies"]
						.reduce((acc, cur) => acc += updateConfigSection(srcConfig, targetConfig, cur), 0),
	prettyJson = function(data) {
		return JSON.stringify(data, null, 2);
	},
	rewrite = function(updated, filePath, data) {
		try {
			fs.writeFileSync(filePath, prettyJson(data), ioOpts);
			return { success: true };
		} catch (e) {
			return { success: false, error: e };
		}
	},
	status = updated 
						? rewrite(updated, targetPath, targetConfig) 
						: { success: true, error: "No dependencies to update" },
	logged = log(
					status.success
					? status.error || `Updated ${updated} dependency versions`
					: status.error
	);
process.exit(logged && status.success ? 0 : 1);