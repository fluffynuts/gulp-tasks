(function() {
  class SystemResult {
    constructor(
      public exe: string,
      public args: string[],
      public exitCode: Optional<number>,
      public stderr: string[],
      public stdout: string[]
    ) {
    }

    isResult(): this is SystemResult {
      return true;
    }

    static isResult(o: any): o is SystemResult {
      return o instanceof SystemResult;
    }
  }
  module.exports = SystemResult;
})();
