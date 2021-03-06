const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Initial Data", () => {
  context("when a value is given", () => {
    it("is accessible at runtime", () => {
      const geneva = Geneva.withArrayParser({
        initial: {
          foo: "bar",
        },
      });
      const result = geneva.run("~foo");
      expect(result).to.equal("bar");
    });
  });

  context("when a function is given", () => {
    it("is accessible at runtime", () => {
      const geneva = Geneva.withArrayParser({
        initial: {
          foo: (name) => `Hello, ${name}`,
        },
      });
      const result = geneva.run(["!foo", ["!identity", "bar"]]);
      expect(result).to.equal("Hello, bar");
    });
  });

  context("when a form is given", () => {
    it("evaluates correctly", () => {
      const geneva = Geneva.withArrayParser({
        forms: {
          foo: (runner, args) => {
            const name = runner.run(args[0]);
            return `Hello, ${name}`;
          },
        },
      });
      const result = geneva.run(["!foo", ["!join", "", ["b", "a", "r"]]]);
      expect(result).to.equal("Hello, bar");
    });
  });
});
