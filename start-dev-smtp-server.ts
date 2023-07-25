(function() {
  const
    { ZarroError } = requireModule("zarro-error"),
    { log } = requireModule<GulpUtil>("gulp-util"),
    { redBright, yellowBright } = requireModule<AnsiColors>("ansi-colors"),
    env = requireModule<Env>("env"),
    debug = require("debug")("start-smtp-server"),
    mailpitAllIps = "[::]",
    gulp = requireModule<Gulp>("gulp");

  env.associate([
      env.DEV_SMTP_DETACHED,
      env.DEV_SMTP_PORT,
      env.DEV_SMTP_BIND_IP,
      env.DEV_SMTP_INTERFACE_PORT,
      env.DEV_SMTP_INTERFACE_BIND_IP,
      env.DEV_SMTP_IGNORE_ERRORS,
      env.DEV_SMTP_OPEN_INTERFACE
    ], "start-dev-smtp-server"
  );

  gulp.task("start-dev-smtp-server", async () => {
    const
      spawn = requireModule<Spawn>("spawn"),
      mailpitBinary = await findOrDownloadMailpit(),
      smtpPort = env.resolveNumber(env.DEV_SMTP_PORT),
      smtpIp = env.resolveWithFallback(env.DEV_SMTP_BIND_IP, mailpitAllIps),
      smtpInterfacePort = env.resolveNumber(env.DEV_SMTP_INTERFACE_PORT),
      smtpInterfaceIp = env.resolveWithFallback(env.DEV_SMTP_INTERFACE_BIND_IP, mailpitAllIps),
      raiseErrors = !env.resolveFlag(env.DEV_SMTP_IGNORE_ERRORS);
    if (mailpitBinary === undefined) {
      const downloadError = `Unable to download mailpit from GitHub`;
      if (raiseErrors) {
        throw new ZarroError(downloadError);
      } else {
        console.error(redBright(downloadError));
        return;
      }
    }
    const args = [] as string[];
    pushSmtpBind(args, smtpIp, smtpPort);
    pushSmtpInterfacePort(args, smtpInterfaceIp, smtpInterfacePort);

    try {
      await Promise.all([
        spawn(
          mailpitBinary,
          args, {
            detached: env.resolveFlag(env.DEV_SMTP_DETACHED)
          }
        ),
        openSmtpInterfaceIfRequired(
          smtpInterfaceIp,
          smtpInterfacePort
        )
      ]);
    } catch (e) {
      const err = e as Error;
      if (raiseErrors) {
        console.error(`${ err.message } (if this service is not absolutely required, set the environment variable ${ env.DEV_SMTP_IGNORE_ERRORS }=1`);
        throw e;
      }
      logError(err.message || `${ e }`)
    }
  });

  async function openSmtpInterfaceIfRequired(
    ip: string,
    port: number
  ): Promise<void> {
    if (!env.resolveFlag(env.DEV_SMTP_OPEN_INTERFACE)) {
      return;
    }
    const
      url = generateInterfaceUrlFor(ip, port),
      { open } = requireModule<Open>("open");
    await waitForUrlToBecomeAvailable(url);
    logInfo(`
    Opening the dev smtp interface in your browser (${url})
    To disable this behavior, set env variable ${env.DEV_SMTP_OPEN_INTERFACE}=0
`.trim());
    await open(url);
  }

  async function waitForUrlToBecomeAvailable(url: string) {
    const
      sleep = requireModule<Sleep>("sleep"),
      HttpClient = requireModule<HttpClientModule>("http-client"),
      httpClient = HttpClient.create();
    do {
      await sleep(500);
    } while (!(await httpClient.exists(url)));
  }

  const ipMap = {
    "[::]": "localhost",
    "127.0.0.1": "localhost"
  } as Dictionary<string>;

  function generateInterfaceUrlFor(
    ip: string,
    port: number
  ): string {
    const
      host = ipMap[ip] ?? ip;
    return `http://${ host }:${ port }`;
  }

  function logError(err: string) {
    log(
      redBright(
        err
      )
    );
  }

  function logInfo(info: string) {
    log(
      yellowBright(
        info
      )
    )
  }

  function pushSmtpBind(
    args: string[],
    ip: string,
    port: number
  ) {
    args.push("--smtp");
    args.push(`${ validateIp(ip) }:${ port }`);
  }

  function pushSmtpInterfacePort(
    args: string[],
    ip: string,
    port: number
  ) {
    args.push("--listen");
    args.push(`${ validateIp(ip) }:${ port }`);
  }

  function validateIp(ip: string): string {
    if (ip === mailpitAllIps) {
      return ip;
    }
    if (ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
      return ip;
    }
    throw new ZarroError(`provided value is not a valid IP: ${ ip }`);
  }

  async function tryFindMailpitUnder(folder: string): Promise<Optional<string>> {
    const
      { ls } = require("yafs"),
      os = require("os"),
      path = require("path"),
      contents = await ls(folder, { fullPaths: true });

    const seek = os.platform() === "win32"
      ? "mailpit.exe"
      : "mailpit";
    for (const item of contents) {
      const fn = path.basename(item);
      if (fn.toLowerCase() === seek) {
        debug(`will start smtp server at: ${ item }`);
        return item;
      }
    }
  }

  async function findOrDownloadMailpit(): Promise<Optional<string>> {
    const
      { ExecStepContext } = require("exec-step"),
      ctx = new ExecStepContext(),
      path = require("path"),
      getToolsFolder = requireModule<GetToolsFolder>("get-tools-folder"),
      target = path.join(getToolsFolder(), "mailpit"),
      { fetchLatestRelease } = require("./modules/fetch-github-release/src");

    const existing = await tryFindMailpitUnder(target);
    if (existing) {
      return existing;
    }

    return ctx.exec(
      "fetching mailpit",
      async () => {
        await fetchLatestRelease({
          owner: "axllent",
          repo: "mailpit",
          destination: target,
          shouldExtract: true
        });

        const downloaded = await tryFindMailpitUnder(target);
        if (downloaded) {
          return downloaded;
        }

        console.error(
          redBright(`Unable to find mailpit binary under ${ target }`)
        );
        return undefined;
      });
  }
})();
