(function() {

  function withEnvironment(
    env: Dictionary<string>,
    replaceExistingEnvironment?: boolean
  ): TemporaryEnvironmentRunner {
    return new TemporaryEnvironmentRunnerImpl(env, replaceExistingEnvironment);
  }

  class TemporaryEnvironmentRunnerImpl implements TemporaryEnvironmentRunner {
    private readonly replaceExistingEnvironment: boolean;
    constructor(
      private env: Dictionary<string>,
      existingEnvironment?: boolean
    ) {
      this.replaceExistingEnvironment = existingEnvironment ?? false;
    }

    public async run<T>(fn: (() => T | Promise<T>)): Promise<T> {
      const
        oldEnv = { ...process.env };
      try {
        if (this.replaceExistingEnvironment) {
          replaceEnv(this.env);
        } else {
          augmentEnv(this.env);
        }
        return await fn();
      } finally {
        replaceEnv(oldEnv);
      }
    }
  }

  function replaceEnv(env: Dictionary<string | undefined>) {
    for (let k of Object.keys(process.env)) {
      delete process.env[k];
    }
    augmentEnv(env);
  }

  function augmentEnv(env: Dictionary<string | undefined>) {
    for (let k of Object.keys(env)) {
      process.env[k] = env[k];
    }
  }

  enum ExistingEnvironment {
    keep,
    drop,
  }

  module.exports = {
    withEnvironment,
    ExistingEnvironment
  };
})();
