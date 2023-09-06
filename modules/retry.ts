(function() {
  const
    ZarroError = requireModule<ZarroError>("zarro-error"),
    sleep = requireModule<Sleep>("sleep");
  async function retry<T>(
    fn: (() => Promise<T>),
    attempt?: number,
    maxAttempts?: number,
    wait?: number
  ): Promise<T> {
    let thisAttempt = attempt ?? 0;
    const max = maxAttempts ?? 10;
    let waitMs = wait ?? 5000;
    if (waitMs < 1000) {
      waitMs *= 1000;
    }
    try {
      const result = await fn();
      return result;
    } catch (e) {
      if (thisAttempt >= max) {
        throw new ZarroError(`${ e } (giving up after ${ attempt } attempts)`);
      }
      await sleep(waitMs);
      return retry(fn, thisAttempt, max, waitMs)
    }
  }
  module.exports = retry;
})();
