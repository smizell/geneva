const { ConfigBuilder } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;
const fs = require("fs");

describe("ConfigBuilder", function () {
  context("basic configuration", function () {
    let config;

    beforeEach(function () {
      config = ConfigBuilder.fromYAML(
        fs.readFileSync("./test/examples/basic-config.yml", "utf-8")
      );
    });

    it("correctly executes", function () {
      const run = config.build({ firstName: "Jane", lastName: "Doe" });
      const results = run();
      expect(results.greeting).to.equal("Hello, Jane Doe");
    });
  });
});
