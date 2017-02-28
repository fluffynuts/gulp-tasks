var fs = require('fs'),
    http = require('http'),
    debug = require('debug')('http-downloader');
function HttpDownloader(infoLogFunction, debugLogFunction) {
  this._info = infoLogFunction || console.log;
  this._debug = debugLogFunction || function () { };
  this.assumeDownloadedIfExistsAndSizeMatches = true;
}

HttpDownloader.prototype = {
  download: function (url, target) {
    if (this._request) {
      throw new Error('Already downloading.');
    }
    var result = this._createResultPromise();
    this._url = url;
    this._target = target;
    this._tempTarget = target + '.part';
    var self = this;
    this._info('Start download of "' + url + '"');
    this._request = http.get(this._url, function (response) {
      self._response = response;
      self._handleResponse();
    }).on('error', function (e) {
      self._reject('Download failed: ' + (e || 'unknown error'));
    });
    return result;
  },
  abort: function () {
    if (this._request) {
      this._request.abort();
      this._clear();
    }
  },
  _handleResponse: function () {
    this._downloadSize = parseInt(this._response.headers['content-length']);
    if (this._alreadyDownloaded()) {
      this._request.destroy();
      return this._resolve(this._target);
    }
    if (fs.existsSync(this._target)) {
      fs.unlinkSync(this._target);
    }
    this._statusSuffix = '% of ' + this._humanSize(this._downloadSize);
    this._bindOnResponsedata();
    this._bindOnResponseEnd();
    this._bindOnResponseError();
  },
  _bindOnResponsedata: function () {
    this._lastData = new Date();
    this._written = 0;
    var self = this;
    this._response.on('data', function (data) {
      self._lastData = new Date();
      self._debug('writing ' + data.length + ' bytes to ' + self._tempTarget);
      fs.appendFileSync(self._tempTarget, data);
      self._updateStatus(data);
    });
  },
  _updateStatus: function (data) {
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
  _bindOnResponseEnd: function () {
    var self = this;
    this._response.on('end', function () {
      self._clearStatus();
      self._rename(self._tempTarget, self._target);
      self._clear();
    });
  },
  _rename: function (src, dst, attempts) {
    try {
      debug('attempt rename of temp file');
      fs.renameSync(src, dst)
      this._clearStatus();
      this._info('-> download complete!');
      this._resolve(dst)
    } catch (e) {
      debug('rename error:', e);
      if (attempts > 99) {
        this._reject(['Unable to rename "', src, '" to "', ds, '": ', e].join(''));
      } else {
        var self = this;
        setTimeout(function () {
          self._rename(src, dst, attempts++);
        }, 100);
      }
    }
  },
  _bindOnResponseError: function () {
    var self = this;
    this._response.on('error', function (err) {
      self._handleDownloadError(err);
    });
  },
  _handleDownloadError: function (err) {
    this._reject([
      'Download of "',
      this._url,
      '" failed: \n',
      this._errorStringFor(err)
    ]);
  },
  _errorStringFor: function (err) {
    if (!err) {
      return 'Unknown error';
    }
    if (typeof (err.toString) === 'function') {
      return err.toString();
    }
    return '' + err;
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
  _createResultPromise: function () {
    var self = this;
    return new Promise(function (resolve, reject) {
      self._resolveFunction = resolve;
      self._rejectFunction = reject;
    });
  },
  _resolve: function (data) {
    debug('resolving final promise!');
    this._resolveFunction(data);
  },
  _reject: function (data) {
    debug('rejecting final promise!');
    this._rejectFunction(data);
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
