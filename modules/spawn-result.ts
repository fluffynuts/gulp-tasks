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
  }
  module.exports = SpawnResult;
})();
