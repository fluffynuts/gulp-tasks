"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spawn = requireModule("spawn"), gulp = requireModule("gulp-with-help"), env = requireModule("env"), chalk = require("chalk"), resolveMasks = requireModule("resolve-masks"), debug = require("debug")("update-self"), es = require("event-stream");
env.associate([
    env.DRY_RUN,
    env.INCLUDE_PACKAGE_JSON,
    env.EXCLUDE_PACKAGE_JSON
], "update-self");
gulp.task("update-self", "Updates zarro throughout your current project", () => {
    const glob = resolveMasks(env.INCLUDE_PACKAGE_JSON, env.EXCLUDE_PACKAGE_JSON);
    debug({
        glob
    });
    return gulp.src(glob)
        .pipe(updateZarroPipe(env.resolveFlag(env.BETA)));
});
function updateZarroPipe(beta) {
    const promises = [];
    const stream = es.through(function input(file) {
        let save = false, saveDev = false;
        const json = file.contents.toString();
        try {
            const search = "zarro", packageIndex = JSON.parse(json), deps = packageIndex.dependencies || {}, devDeps = packageIndex.devDependencies || {};
            save = Object.keys(deps).includes(search);
            saveDev = Object.keys(devDeps).includes(search);
            if (!save && !saveDev) {
                debug(`${search} not installed in ${file.path}`);
                return;
            }
        }
        catch (e) {
            debug(`${file.path} is not valid JSON`);
            return;
        }
        console.log(chalk.yellow(`update zarro in: ${file.dirname}`));
        const proc = "npm", tag = beta ? "beta" : "latest", args = ["install", save ? "--save" : "--save-dev", `zarro@${tag}`, "--no-progress", "--silent"], opts = {
            cwd: file.dirname
        };
        if (env.resolveFlag(env.DRY_RUN)) {
            console.log({
                label: "would run spawn with",
                proc,
                args,
                opts
            });
        }
        else {
            promises.push(spawn.call(null, proc, args, opts));
        }
    }, async function end() {
        try {
            await Promise.all(promises);
            stream.emit("end");
        }
        catch (err) {
            console.error(chalk.redBright(`
 ==================================================
| WARNING: Unable to update zarro, error(s) follow |
 ==================================================
`));
            stream.emit("error", err);
        }
    });
    return stream;
}
