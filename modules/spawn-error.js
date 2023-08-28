"use strict";
(function () {
    class SpawnError extends Error {
        get args() {
            return this._args;
        }
        get exe() {
            return this._exe;
        }
        get exitCode() {
            return this._exitCode;
        }
        get stdout() {
            return this._stdout ? [...this._stdout] : [];
        }
        get stderr() {
            return this._stderr ? [...this._stderr] : [];
        }
        constructor(message, exe, args, exitCode, stdout, stderr) {
            super(message);
            this._args = args || [];
            this._exe = exe;
            this._exitCode = exitCode;
            this._stderr = stderr ? [...stderr] : null;
            this._stdout = stdout ? [...stdout] : null;
        }
        toString() {
            const lines = [
                `${this.exe} ${this.args.join(" ")}`,
                `Process exited with code: ${this.exitCode}`,
            ];
            if (this._stderr === null && this._stdout === null) {
                // io has been suppressed;
                return lines.join("\n");
            }
            const hasStdOut = this.stdout && this.stdout.length > 0;
            const hasStdErr = this.stderr && this.stderr.length > 0;
            const hasOutput = hasStdErr || hasStdOut;
            if (!hasOutput) {
                lines.push("No output was captured on stderr or stdout.");
                return lines.join("\n");
            }
            if (hasStdErr) {
                this.addOutput(lines, "stderr:", this.stderr);
                if (hasStdOut) {
                    lines.push("");
                }
            }
            if (hasStdOut) {
                this.addOutput(lines, "stdout:", this.stdout);
            }
            return lines.join("\n");
        }
        addOutput(lines, label, source) {
            lines.push(label);
            for (const line of source) {
                lines.push(` ${line}`);
            }
        }
        static isSpawnError(o) {
            return o instanceof SpawnError;
        }
    }
    module.exports = SpawnError;
})();
