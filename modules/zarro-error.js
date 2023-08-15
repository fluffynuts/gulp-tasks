class ZarroError extends Error {
  get shouldAlwaysSurface() {
    return true;
  }
}

module.exports = ZarroError;
