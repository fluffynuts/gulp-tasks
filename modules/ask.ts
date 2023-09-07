(function() {
  const
    readline = require("readline");

  interface AskOptions {
    inputStream?: NodeJS.ReadStream,
    outputStream?: NodeJS.WriteStream,
    validator?: ((data: string) => boolean)
  }

  function defaultValidator(s: string): boolean {
    return true;
  }

  const defaultOptions: AskOptions = {
    inputStream: process.stdin,
    outputStream: process.stdout,
    validator: defaultValidator // grab only the first answer, irrespective of what it is
  };

  async function ask(message: string, opts?: AskOptions): Promise<string> {
    opts = Object.assign({}, defaultOptions, opts || {});
    const { validator } = opts;
    const validatorFn = !!validator
      ? validator
      : defaultValidator;
    const rl = readline.createInterface({
      input: opts.inputStream,
      output: opts.outputStream
    });

    const lines: string[] = [];
    while (true) {
      try {
        const result = await new Promise<string>((resolve, reject) => {
          rl.question(format(message), (line: string) => {
            lines.push(line);
            const all = lines.join("\n");
            if (validatorFn(all)) {
              rl.close();
              resolve(all);
            } else {
              lines.splice(0, lines.length);
              reject();
            }
          });
        });
        return result;
      } catch (e) {
          console.error(`invalid answer - try again or press ctrl-c to exit`);
      }
    }
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
