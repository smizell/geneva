const fs = require("fs");
const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Read File", function () {
  context("when given a filepath", function () {
    it("renders the string", function () {
      const geneva = new Geneva({ fs });
      const results = geneva.run({
        "fn:readFile": "./test/examples/file.txt",
      });
      expect(results).to.equal("Hello, Jane Doe\n");
    });
  });
});
