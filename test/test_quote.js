const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Quote", () => {
  context("when used", () => {
    it("returns unevaluated value", () => {
      const geneva = Geneva.withArrayParser();
      const result = geneva.run(["!quote", ["!sum", [1, 2]]]);
      expect(result).to.deep.equal(["!sum", [1, 2]]);
    });
  });
});
