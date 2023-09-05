"use strict";
(function () {
    class SystemResult {
        constructor(exe, args, exitCode, stderr, stdout) {
            this.exe = exe;
            this.args = args;
            this.exitCode = exitCode;
            this.stderr = stderr;
            this.stdout = stdout;
        }
        isResult() {
            return true;
        }
        static isResult(o) {
            return o instanceof SystemResult;
        }
    }
    module.exports = SystemResult;
})();
