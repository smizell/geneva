const { Geneva, SimpleFS } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Read File", function () {
  context("when given a filepath", function () {
    it("renders the string", function () {
      const fs = new SimpleFS({
        "file.txt": "Hello, Jane Doe",
      });
      const geneva = new Geneva({ fs });
      const results = geneva.run({
        "fn:readFile": "file.txt",
      });
      expect(results).to.equal("Hello, Jane Doe");
    });
  });
});
