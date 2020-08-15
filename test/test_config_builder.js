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

    it("correctly executes with valid data", function () {
      const run = config.build({ firstName: "Jane", lastName: "Doe" });
      const results = run();
      expect(results.greeting).to.equal("Hello, Jane Doe");
    });

    it("throws when a required field is left out", function () {
      function runner() {
        config.build({ firstName: "Jane" });
      }
      expect(runner).to.throw();
    });

    it("throws when checks aren't met", function () {
      function runner() {
        config.build({ firstName: 12, lastName: "Doe" });
      }
      expect(runner).to.throw();
    });
  });
});
