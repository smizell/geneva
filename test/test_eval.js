const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Eval", () => {
  context("when used", () => {
    it("runs the code passed to it", () => {
      const geneva = Geneva.withArrayParser();
      const result = geneva.run(["!eval", ["!quote", ["!sum", [1, 2]]]]);
      expect(result).to.deep.equal(3);
    });
  });
});
