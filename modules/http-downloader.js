var fs = require('fs'),
  request = require('request'),
  debug = require('debug')('http-downloader');

function HttpDownloader(infoLogFunction, debugLogFunction) {
  this._info = infoLogFunction || console.log;
  this._debug = debugLogFunction || debug;
  this.assumeDownloadedIfExistsAndSizeMatches = true;
}

HttpDownloader.prototype = {
  download: function (url, target) {
    const partFile = `${target}.part`;
    return new Promise((resolve, reject) => {
      this._request = request.get(url, { timeout: 30000 })
        .on("response", (response) => {
          this._debug(`got response: ${JSON.stringify(response)}`);
          this._downloadSize = parseInt(response.headers["content-length"]);
          this._statusSuffix = '% of ' + this._humanSize(this._downloadSize);
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
  },
  abort: function () {
    if (this._request) {
      self._errored = true;
      this._request.abort();
      this._clear();
    }
  },
  _updateStatus: function (data) {
    if (process.env.SUPPRESS_DOWNLOAD_PROGRESS) {
      return;
    }
    this._written = this._written || 0;
    this._written += data.length;
    var perc = Math.round((100 * this._written) / this._downloadSize);
    if (perc != this._lastPerc) {
      this._writeStatus(perc + this._statusSuffix);
      this._lastPerc = perc;
    }
  },
  _writeStatus: function (msg) {
    this._clearStatus();
    process.stdout.write(msg);
  },
  _rename: function (resolve, reject, src, dst, attempts) {
    try {
      this._debug('attempt rename of temp file');
      fs.renameSync(src, dst)
      this._clearStatus();
      this._info('-> download complete!');
      resolve(dst)
    } catch (e) {
      this._debug('rename error:', e);
      if (attempts > 99) {
        reject(['Unable to rename "', src, '" to "', ds, '": ', e].join(''));
      } else {
        setTimeout(()=> {
          this._rename(resolve, reject, src, dst, attempts++);
        }, 100);
      }
    }
  },
  _clearStatus: function () {
    process.stdout.write('\r               \r');
  },
  _humanSize: function (size) {
    var suffixes = ['b', 'kb', 'mb', 'tb', 'pb'];
    for (var i = 0; i < suffixes.length - 1; i++) {
      if (size < 1024) {
        return size.toFixed(2) + suffixes[i];
      }
      size /= 1024;
    }
    return size.toFixed(2) + suffixes[suffixes.length - 1];
  },
  _clear: function () {
    var self = this;
    ['_request', '_response', '_downloadSize', '_lastPerc',
      '_resolveFunction', '_rejectFunction', '_lastData', '_statusSuffix'
    ].forEach(function (prop) {
      self[prop] = undefined;
    });
  },
  _alreadyDownloaded: function () {
    if (!this.assumeDownloadedIfExistsAndSizeMatches) {
      return false;
    }
    if (!fs.existsSync(this._target)) {
      return false;
    }
    var lstat = fs.lstatSync(this._target);
    return lstat.size === this._downloadSize;
  }
}

module.exports = HttpDownloader;
