const
  expect = require("chai").expect,
  sut = require("../../modules/env");
describe("module:env", () => {
  it("should export the multiSplit function", function () {
    // Arrange
    // Act
    expect(sut.multiSplit).to.be.a.function;
    // Assert
  });
  describe("multiSplit", () => {
    it("should split a string based on multiple delimiters", function () {
      // Arrange
      const
        input = "1,2;3",
        delimiters = [",", ";"],
        expected = ["1", "2", "3"]
      // Act
      const result = sut.multiSplit(input, delimiters);
      // Assert
      expect(result).to.eql(expected);
    });
  });
  describe("getVar", () => {
    it("should exist as a function", function () {
      // Arrange
      // Act
      expect(sut.getVar).to.be.a.function;
      // Assert
    });
    it("should get the value of a process.env key when it exists", function () {
      // Arrange
      const
        varName = "onetwothree",
        expected = "123";
      process.env[varName] = expected;
      // Act
      const result = sut.getVar(varName);
      // Assert
      expect(result).to.equal(expected);
    });
    it("should return the provided default value when the env var is not found", function () {
      // Arrange
      const
        varName = "NOT_FOUND",
        expected = "abc";
      expect(process.env[varName]).to.be.undefined;
      // Act
      const result = sut.getVar(varName, expected);
      // Assert
      expect(result).to.equal(expected);
    });
  });
  describe("getArray", () => {
    it("should exist as a function", function () {
      // Arrange
      // Act
      expect(sut.getArray).to.be.a.function;
      // Assert
    });
    [
      ",", ";"
    ].forEach(delimiter => {
      it(`should return the split environment variable delimited with default delimiter ${delimiter}`, function () {
        // Arrange
        const
          varName = "SOME_ARRAY",
          expected = ["1", "2", "3"];
        process.env[varName] = expected.join(delimiter);
        // Act
        const result = sut.getArray(varName);
        // Assert
        expect(result).to.eql(expected);
      });
    })
    it("should return the fallback when the env var is not found", function () {
      // Arrange
      const
        varName = "NOT_FOUND_ARRAY",
        expected = ["1", "2", "3"];
      process.env["SOME_ARRAY"] = expected.join(",");
      expect(process.env[varName]).to.be.undefined;
      // Act
      const result = sut.getArray(varName, expected);
      // Assert
      expect(result).to.eql(expected);
    });
    [
      { d: "/", v: "foo/bar", e: ["foo", "bar"] },
      { d: ["/"], v: "foo/bar", e: ["foo", "bar"] },
      { d: ["_", "/"], v: "foo/bar_quz", e: ["foo", "bar", "quz"] }
    ].forEach(tc => {
      it("should return the array when custom delimiters are provided", () => {
        // Arrange
        const
          varName = "SOME_ARRAY_VALUE";
        process.env[varName] = tc.v;
        // Act
        var result = sut.getArray(varName, [], tc.d);
        // Assert
        expect(result).to.eql(tc.e);
      });
    });
  });
});