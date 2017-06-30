const
  expect = require("chai").expect,
  sut = require("../../modules/build-scenarios");
describe("module:build-scenarios", () => {
  describe("generate", () => {
    it("should be a function", function () {
      // Arrange
      // Act
      const result = sut.generate;
      // Assert
      expect(result).to.be.a.function;
    });
    it("should return one target for build:clean-build:debug:x86", () => {
      // Arrange
      const
        targets = ["Clean", "Build"],
        configurations = ["Debug"],
        platforms = ["x86"];
      // Act
      const result = sut.generate(targets, configurations, platforms);
      // Assert
      expect(result).to.have.length.of(1);
      const task = result[0];
      expect(task.name).to.equal("build:clean-build:debug:x86");
      expect(task.targets).to.eql(targets);
      expect(task.configuration).to.eql("Debug");
      expect(task.architecture).to.eql("x86");
    });
  });
});