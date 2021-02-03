(function() {
  const
    readline = require("readline");

  interface AskOptions {
    inputStream: NodeJS.ReadStream,
    outputStream: NodeJS.WriteStream,
    done: ((data: string) => boolean)
  }

  const defaultOptions: AskOptions = {
    inputStream: process.stdin,
    outputStream: process.stdout,
    done: (s: string) => true // grab only the first line
  };

  async function ask(message: string, opts?: AskOptions): Promise<string> {
    opts = Object.assign({}, defaultOptions, opts || {});
    const { done } = opts;
    const rl = readline.createInterface({
      input: opts.inputStream,
      output: opts.outputStream
    });

    const lines: string[] = [];
    return new Promise((resolve, reject) => {
      rl.question(message, (line: string) => {
        lines.push(line);
        const all = lines.join("\n");
        if (done(all)) {
          rl.close();
          resolve(all);
        }
      });
    });
  }

  module.exports = {
    ask
  }
})();
