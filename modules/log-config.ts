(function() {
  const
    padRight = require("./pad-right"),
    log = requireModule<Log>("log"),
    chalk = requireModule<AnsiColors>("ansi-colors");

  function output(logLines: LogLine[]) {
    const longest = logLines
      .map(o => o.title.length)
      .reduce((acc, cur) => (acc > cur ? acc : cur), 0);
    logLines
      .sort((a, b) => (a.title > b.title ? 1 : 0))
      .forEach(line => {
        const pre = chalk.yellowBright(padRight(line.title, longest)),
          next = chalk.cyanBright(`${ line.value }`);
        log.info(`${ pre } : ${ next }`);
      });
  }

  interface LogLine {
    title: string;
    value: string;
  }

  function store(
    logLines: LogLine[],
    config: any,
    prop: string,
    title: string
  ): LogLine[] {
    const value = config[prop];
    if (value !== undefined) {
      logLines.push({ title, value });
    }
    return logLines;
  }

  module.exports = function logConfig(
    config: any,
    labels: Dictionary<string>
  ) {
    const logLines = Object.keys(labels).reduce(
      (acc, cur) => store(acc, config, cur, labels[cur]),
      [] as LogLine[]
    );
    output(logLines);
  };
})();
