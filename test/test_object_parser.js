const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Object Parser", function () {
  context("simple code", function () {
    it("correctly executes", function () {
      const geneva = Geneva.withObjectParser();
      const result = geneva.run({ "fn:identity": [42] });
      expect(result).to.equal(42);
    });
  });
});
