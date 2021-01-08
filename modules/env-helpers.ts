(function() {
  function env(name: string, fallback?: string): string {
    const value = process.env[name];
    if (value !== undefined) {
      return value;
    }
    const argCount = Array.from(arguments).length;
    if (argCount > 1) {
      return fallback as string;
    }
    throw new Error(
      `environment variable '${ name }' is not defined and no fallback provided`
    );
  }

  function envNumber(name: string, fallback?: number): number {
    const
      haveFallback = fallback !== undefined,
      value = haveFallback ? env(name, fallback?.toString()) : env(name),
      parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
    throw new Error(
      `environment variable '${ name }' is invalid: expected numeric value but found '${ value }'`
    );
  }

  function envFlag(name: string, fallback?: boolean): boolean {
    const
      haveFallback = fallback !== undefined,
      value = haveFallback ? env(name, fallback?.toString()) : env(name);
    return parseBool(name, value);
  }

  const truthy = [
      "1",
      "yes",
      "true"
    ],
    falsey = [
      "0",
      "no",
      "false"
    ];

  function parseBool(name: string, value: string): boolean {
    if (truthy.indexOf(value?.toString()) > -1) {
      return true;
    }
    if (falsey.indexOf(value?.toString()) > -1) {
      return false;
    }
    throw new Error(
      `environment variable '${name}' is invalid: could not parse '${value}' as a boolen value`
    );
  }

  module.exports = {
    env,
    envNumber,
    envFlag
  }

})();
