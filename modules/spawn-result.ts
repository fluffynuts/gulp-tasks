(function() {
  class SpawnResult {
    constructor(
      public exe: string,
      public args: string[],
      public exitCode: number,
      public stderr: string[],
      public stdout: string[]
    ) {
    }

    static isSpawnResult(o: any): o is SpawnResult {
      return o instanceof SpawnResult
    }
  }
  module.exports = SpawnResult;
})();
