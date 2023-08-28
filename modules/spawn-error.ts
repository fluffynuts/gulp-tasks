(function() {
  class SpawnErrorImpl extends Error
  {
    get args(): string[] {
      return this._args;
    }

    get exe(): string {
      return this._exe;
    }

    get exitCode(): number {
      return this._exitCode;
    }

    get stdout(): string[] {
      return this._stdout ? [ ...this._stdout ] : [];
    }

    get stderr(): string[] {
      return this._stderr ? [ ...this._stderr ] : [];
    }

    private readonly _args: string[];
    private readonly _exe: string;
    private readonly _exitCode: number;
    private readonly _stdout: Nullable<string[]>;
    private readonly _stderr: Nullable<string[]>;

    constructor(
      message: string,
      exe: string,
      args: string[] | undefined,
      exitCode: number,
      stdout: Nullable<string[]>,
      stderr: Nullable<string[]>
    ) {
      super(message);
      this._args = args || [];
      this._exe = exe;
      this._exitCode = exitCode;
      this._stderr = stderr ? [ ...stderr ] : null;
      this._stdout = stdout ? [ ...stdout ] : null;
    }

    public toString(): string {
      const lines = [
        `${ this.exe } ${ this.args.join(" ") }`,
        `Process exited with code: ${ this.exitCode }`,
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

    private addOutput(lines: string[], label: string, source: string[]) {
      lines.push(label);
      for (const line of source) {
        lines.push(` ${ line }`);
      }
    }
  }
  module.exports = SpawnErrorImpl;
})();
