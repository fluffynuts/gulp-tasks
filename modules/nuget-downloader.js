const
  HttpDownloader = require("./http-downloader"),
  path = require("path"),
  url = 'http://dist.nuget.org/win-x86-commandline/latest/nuget.exe';

module.exports = (targetFolder) => {
  const downloader = new HttpDownloader();
  return downloader.download(url, path.join(targetFolder, "nuget.exe"));
};
