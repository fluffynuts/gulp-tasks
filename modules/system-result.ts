(function() {
  class SystemResult {
    constructor(
      public exe: string,
      public args: string[],
      public exitCode: number,
      public stderr: string[],
      public stdout: string[]
    ) {
    }

    static isSystemResult(o: any): o is SystemResult {
      return o instanceof SystemResult;
    }
    static isResult(o: any): o is SystemResult {
      return o instanceof SystemResult;
    }
  }
  module.exports = SystemResult;
})();
