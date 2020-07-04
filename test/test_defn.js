const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Defn", () => {
  context("when called", () => {
    it("returns the correct value", function () {
      const geneva = Geneva.withArrayParser();
      const result = geneva.run([
        "!do",
        ["!defn", "square", ["n"], ["!multiply", "~n", "~n"]],
        ["!square", 4],
      ]);
      expect(result).to.equal(16);
    });
  });
});
