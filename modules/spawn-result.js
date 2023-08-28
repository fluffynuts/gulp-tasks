"use strict";
(function () {
    class SpawnResult {
        constructor(exe, args, exitCode, stderr, stdout) {
            this.exe = exe;
            this.args = args;
            this.exitCode = exitCode;
            this.stderr = stderr;
            this.stdout = stdout;
        }
    }
    module.exports = SpawnResult;
})();
