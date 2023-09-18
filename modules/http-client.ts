import { RequestResponse, ResponseRequest } from "request";
import { fileExists } from "yafs";

(function() {
  const
    fs = require("fs"),
    path = require("path"),
    ZarroError = requireModule<ZarroError>("zarro-error"),
    sleep = requireModule<Sleep>("sleep"),
    promisifyStream = requireModule<PromisifyStream>("promisify-stream"),
    ensureFolderExists = require("./ensure-folder-exists").sync,
    request = require("request"),
    debug = requireModule<DebugFactory>("debug")(__filename);

  class HttpClient {
    public assumeDownloadedIfExistsAndSizeMatches: boolean;
    public aborted: boolean = false;
    public suppressProgress: boolean = false;

    private readonly _info: (s: string) => void;
    private readonly _debug: any;
    private _request: Optional<ResponseRequest>;
    private _downloadSize: number = -1;
    private _statusSuffix: string = "";
    private _written: number = 0;
    private _lastPerc: number = -1;

    constructor(
      infoLogFunction?: (s: string) => void,
      debugLogFunction?: (s: string) => void
    ) {
      this._info = infoLogFunction || console.log;
      this._debug = debugLogFunction || debug;
      this.assumeDownloadedIfExistsAndSizeMatches = true;
    }

    async exists(url: string): Promise<boolean> {
      return new Promise<boolean>(resolve => {
        request.get(url, (err: Error | string) => {
          return resolve(!err);
        })
      });
    }

    async download(url: string, target: string): Promise<string> {
      if (this._alreadyDownloaded(target)) {
        return target;
      }
      const partFile = `${ target }.part`;
      const inFlight = this._request;
      if (inFlight) {
        await promisifyStream(inFlight);
        while (!await fileExists(target)) {
          await sleep(50);
        }
      }
      ensureFolderExists(path.dirname(partFile));
      return new Promise(async (resolve, reject) => {
        const req = this._request = request.get(url, { timeout: 30000 })
          .on("response", (response: RequestResponse) => {
            this._debug(`got response: ${ JSON.stringify(response) }`);
            this._downloadSize = parseInt(response.headers["content-length"] || "0");
            this._statusSuffix = "% of " + this._humanSize(this._downloadSize);
          })
          .on("error", (e: any) => {
            this._debug(`got error: ${ e }`);
            reject(e);
          })
          .on("data", (data: Buffer) => {
            this._debug(`got ${ data.length } bytes`);
            this._updateStatus(data);
          })
          .on("end", () => {
            this._clear();
          }).pipe(fs.createWriteStream(partFile));
        const promise = promisifyStream(req);
        try {
          await promise;
          await this._rename(partFile, target);
          resolve(target);
        } catch (e) {
          reject(e);
        }
      });
    }

    abort() {
      if (this._request) {
        this.aborted = true;
        this._request.abort();
        this._clear();
      }
    }

    _updateStatus(data: Buffer) {
      debugger;
      if (this.suppressProgress || process.env.SUPPRESS_DOWNLOAD_PROGRESS || process.env.BUILD_NUMBER /* automatically disable at Jenkins CI */) {
        return;
      }
      this._written += data.length;
      const perc = Math.round((100 * this._written) / this._downloadSize);
      if (perc != this._lastPerc) {
        this._writeStatus(perc + this._statusSuffix);
        this._lastPerc = perc;
      }
    }

    _writeStatus(msg: string) {
      this._clearStatus();
      process.stdout.write(msg);
    }

    async _rename(
      src: string,
      dst: string,
      attempts: number = 0
    ): Promise<void> {
      try {
        this._debug("attempt rename of temp file");
        fs.renameSync(src, dst);
        this._clearStatus();
        this._info(`-> ${ dst } download complete!`);
      } catch (e) {
        this._debug("rename error:", e);
        if (attempts > 99) {
          throw            new ZarroError(
            [ "Unable to rename \"", src, "\" to \"", dst, "\": ", e ].join("")
          );
        } else {
          await sleep(100);
          return this._rename(src, dst, attempts++);
        }
      }
    }

    _clearStatus() {
      process.stdout.write("\r               \r");
    }

    _humanSize(size: number) {
      const suffixes = [ "b", "kb", "mb", "tb", "pb" ];
      for (let i = 0; i < suffixes.length - 1; i++) {
        if (size < 1024) {
          return size.toFixed(2) + suffixes[i];
        }
        size /= 1024;
      }
      return size.toFixed(2) + suffixes[suffixes.length - 1];
    }

    _clear() {
      this._request = undefined;
      this._downloadSize = -1;
      this._lastPerc = -1;
    }

    _alreadyDownloaded(target: string) {
      if (!this.assumeDownloadedIfExistsAndSizeMatches) {
        return false;
      }
      if (!fs.existsSync(target)) {
        return false;
      }
      const lstat = fs.lstatSync(target);
      return lstat.size === this._downloadSize;
    }

    static create(
      infoLogFunction?: (s: string) => void,
      debugLogFunction?: (s: string) => void
    ): HttpClient {
      return new HttpClient(
        infoLogFunction,
        debugLogFunction
      );
    }
  }


  module.exports = HttpClient;
})();
