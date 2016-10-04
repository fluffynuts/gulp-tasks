var request = require('request'),
  jsdom = require('jsdom'),
  defaultUrl = 'https://github.com/nunit/nunit/releases/latest';

function NUnitDownloader(url) {
  this._url = url || defaultUrl;
  this._urlPrefix = this._getUrlPrefixFor(this._url);
};

NUnitDownloader.prototype = {
  downloadLatestTo: function (outputFolder) {
    this._ = {};
    this._.outputFolder = outputFolder;
    var result = this._createResultPromise();
    this._startRequest();
    return result;
  },
  _startRequest: function () {
    var self = this;
    request(this._url, function (err, response, body) {
      jsdom.env(body, function (err, window) {
        // TODO: handle errors
        const latestZipLink = self._findLatestZipLinkIn(window.document);
        self._downloadZip(latestZipLink);
      });
    });
  },
  _downloadZip: function (url) {
    request({encoding: null, url: url}, function (err, response, body) {
    });
  },
  _findLatestZipLinkIn: function (doc) {
    var
      self = this,
      anchors = Array.prototype.slice.apply(doc.getElementsByTagName('A'));
    var downloads = anchors.map(a => {
      return a.attributes['href'].value;
    }).filter(link => {
      var
        parts = link.split('/'),
        fileName = parts[parts.length - 1];
      return self._looksLikeDownloadZip(fileName);
    }).sort().reverse();
    return this._urlPrefix + downloads[0];
  },
  _looksLikeDownloadZip: function (fileName) {
    var lname = (fileName || '').toLowerCase();
    return lname.indexOf('nunit-') === 0 &&
      lname.indexOf('-src') === -1 &&
      lname.indexOf('.zip') === lname.length - 4;
  },
  _createResultPromise: function () {
    var self = this;
    return new Promise(function (resolve, reject) {
      self._.resolve = resolve;
      self._.reject = reject;
    });
  },
  _getUrlPrefixFor: function (url) {
    var parts = url.split('/');
    return parts.slice(0, 3).join('/');
  }
};

NUnitDownloader.DEFAULT_URL = defaultUrl;

module.exports = NUnitDownloader;
