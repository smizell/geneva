const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Defn", () => {
  context("when called directly", () => {
    it("returns the correct value", function () {
      const geneva = new Geneva();
      const result = geneva.run({
        "fn:do": [
          {
            "fn:defn": [
              "square",
              ["n"],
              {
                "fn:multiply": ["ref:n", "ref:n"],
              },
            ],
          },
          {
            "fn:square": [4],
          },
        ],
      });
      // const result = geneva.run([
      //   "!do",
      //   ["!defn", "square", ["n"], ["!multiply", "~n", "~n"]],
      //   ["!square", 4],
      // ]);
      expect(result).to.equal(16);
    });
  });
});
