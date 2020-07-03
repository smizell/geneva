const { Geneva, ObjectParser } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Object Parser", function () {
  context("simple code", function () {
    it("correctly executes", function () {
      const parser = new ObjectParser();
      const geneva = new Geneva({ parser });
      const result = geneva.run({ "fn:identity": [42] });
      expect(result).to.equal(42);
    });
  });
});
