const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Read String", () => {
  context("when used", () => {
    it("creates a quote of the string", () => {
      const geneva = Geneva.withArrayParser();
      const result = geneva.run(["!readString", '["!identity", 42]']);
      expect(result).to.deep.equal(["!identity", 42]);
    });
  });
});
