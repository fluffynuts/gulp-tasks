(function() {
  const
    readline = require("readline");

  interface AskOptions {
    inputStream: NodeJS.ReadStream,
    outputStream: NodeJS.WriteStream,
    validator: ((data: string) => boolean)
  }

  const defaultOptions: AskOptions = {
    inputStream: process.stdin,
    outputStream: process.stdout,
    validator: (s: string) => true // grab only the first answer, irrespective of what it is
  };

  async function ask(message: string, opts?: AskOptions): Promise<string> {
    opts = Object.assign({}, defaultOptions, opts || {});
    const { validator } = opts;
    const rl = readline.createInterface({
      input: opts.inputStream,
      output: opts.outputStream
    });

    const lines: string[] = [];
    return new Promise((resolve, reject) => {
      rl.question(format(message), (line: string) => {
        lines.push(line);
        const all = lines.join("\n");
        if (validator(all)) {
          rl.close();
          resolve(all);
        }
      });
    });
  }

  function format(message: string): string {
    if (!message) {
      throw new Error(`no message provided to ask with `);
    }
    if (message.match(/\s+$/)) {
      return message; // already formatted
    }
    if (message.match(/[:?]$/)) {
      return `${message} `; // just add a little space
    }
    return `${message}: `; // assume this is a prompt of some kind
  }

  module.exports = {
    ask
  }
})();
