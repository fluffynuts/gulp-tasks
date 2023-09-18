"use strict";
(function () {
    function splitIfNecessary(data) {
        if (Array.isArray(data)) {
            return [...data];
        }
        return data.split('\n')
            .map(line => line.replace(/\r$/, ""));
    }
    class SystemResultBuilder {
        constructor() {
            this._exe = "";
            this._args = [];
            this._exitCode = 0;
            this._stderr = [];
            this._stdout = [];
            this._mutators = [];
        }
        withExe(exe) {
            return this.with(o => o._exe = exe);
        }
        withArgs(args) {
            return this.with(o => o._args = [...args]);
        }
        withExitCode(exitCode) {
            return this.with(o => o._exitCode = exitCode);
        }
        withStdErr(stderr) {
            return this.with(o => o._stderr = splitIfNecessary(stderr));
        }
        withStdOut(stdout) {
            return this.with(o => o._stdout = splitIfNecessary(stdout));
        }
        with(mutator) {
            this._mutators.push(mutator);
            return this;
        }
        build() {
            for (const mutator of this._mutators) {
                mutator(this);
            }
            return new SystemResult(this._exe, this._args, this._exitCode, this._stderr, this._stdout);
        }
    }
    class SystemResult {
        constructor(exe, args, exitCode, stderr, stdout) {
            this.exe = exe;
            this.args = args;
            this.exitCode = exitCode;
            this.stderr = stderr;
            this.stdout = stdout;
        }
        static create() {
            return new SystemResultBuilder;
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
