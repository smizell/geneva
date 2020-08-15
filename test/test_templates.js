const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Templates", function () {
  context("when referencing variables in the scope", function () {
    it("renders the string", function () {
      const geneva = new Geneva();
      const results = geneva.run({
        "fn:do": [
          {
            "fn:def": ["name", "Jane Doe"],
          },
          {
            "fn:template": "Hello, {{name}}",
          },
        ],
      });
      expect(results).to.equal("Hello, Jane Doe");
    });
  });
});
