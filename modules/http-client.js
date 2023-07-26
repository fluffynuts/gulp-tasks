"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    const fs = require("fs"), path = require("path"), { ZarroError } = requireModule("zarro-error"), ensureFolderExists = require("./ensure-folder-exists").sync, request = require("request"), debug = require("debug")("http-client");
    class HttpClient {
        constructor(infoLogFunction, debugLogFunction) {
            this.aborted = false;
            this.suppressProgress = false;
            this._downloadSize = -1;
            this._statusSuffix = "";
            this._written = 0;
            this._lastPerc = -1;
            this._info = infoLogFunction || console.log;
            this._debug = debugLogFunction || debug;
            this.assumeDownloadedIfExistsAndSizeMatches = true;
        }
        async exists(url) {
            return new Promise(resolve => {
                request.get(url, (err) => {
                    return resolve(!err);
                });
            });
        }
        async download(url, target) {
            if (this._alreadyDownloaded(target)) {
                return target;
            }
            const partFile = `${target}.part`;
            ensureFolderExists(path.dirname(partFile));
            return new Promise((resolve, reject) => {
                this._request = request.get(url, { timeout: 30000 })
                    .on("response", (response) => {
                    this._debug(`got response: ${JSON.stringify(response)}`);
                    this._downloadSize = parseInt(response.headers["content-length"] || "0");
                    this._statusSuffix = "% of " + this._humanSize(this._downloadSize);
                })
                    .on("error", (e) => {
                    this._debug(`got error: ${e}`);
                    reject(e);
                })
                    .on("data", (data) => {
                    this._debug(`got ${data.length} bytes`);
                    this._updateStatus(data);
                })
                    .on("end", () => {
                    this._clear();
                    this._rename(resolve, reject, partFile, target);
                }).pipe(fs.createWriteStream(partFile));
            });
        }
        abort() {
            if (this._request) {
                this.aborted = true;
                this._request.abort();
                this._clear();
            }
        }
        _updateStatus(data) {
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
        _writeStatus(msg) {
            this._clearStatus();
            process.stdout.write(msg);
        }
        _rename(resolve, reject, src, dst, attempts = 0) {
            try {
                this._debug("attempt rename of temp file");
                fs.renameSync(src, dst);
                this._clearStatus();
                this._info(`-> ${dst} download complete!`);
                resolve(dst);
            }
            catch (e) {
                this._debug("rename error:", e);
                if (attempts > 99) {
                    reject(new ZarroError(["Unable to rename \"", src, "\" to \"", dst, "\": ", e].join("")));
                }
                else {
                    setTimeout(() => {
                        this._rename(resolve, reject, src, dst, attempts++);
                    }, 100);
                }
            }
        }
        _clearStatus() {
            process.stdout.write("\r               \r");
        }
        _humanSize(size) {
            const suffixes = ["b", "kb", "mb", "tb", "pb"];
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
        _alreadyDownloaded(target) {
            if (!this.assumeDownloadedIfExistsAndSizeMatches) {
                return false;
            }
            if (!fs.existsSync(target)) {
                return false;
            }
            const lstat = fs.lstatSync(target);
            return lstat.size === this._downloadSize;
        }
        static create(infoLogFunction, debugLogFunction) {
            return new HttpClient(infoLogFunction, debugLogFunction);
        }
    }
    module.exports = HttpClient;
})();
