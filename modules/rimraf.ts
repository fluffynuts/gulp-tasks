const _rimraf = require("rimraf");

export interface RimrafOptions {
  maxBusyTries?: number;
  emfileWait?: number;
  disableGlob?: boolean;
}

export function rimraf(at: string, opts?: RimrafOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    _rimraf(
      at,
      opts,
      (err: Error) => err
        ? reject(err)
        : resolve()
    );
  });
}
