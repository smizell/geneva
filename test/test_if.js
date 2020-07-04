const { Geneva } = require("../lib/base");
const chai = require("chai");
const expect = chai.expect;

describe("Form: if", () => {
  context("when else is given", () => {
    context("when test is false", () => {
      it("returns the else value", () => {
        const geneva = Geneva.withArrayParser();
        const result = geneva.run(["!if", false, "success", "fail"]);
        expect(result).to.equal("fail");
      });
    });
  });

  context("when else not given", () => {
    context("when test is true", () => {
      it("returns the success value", () => {
        const geneva = Geneva.withArrayParser();
        const result = geneva.run(["!if", true, 42]);
        expect(result).to.equal(42);
      });
    });

    context("when test is false", () => {
      it("returns the success value", () => {
        const geneva = Geneva.withArrayParser();
        const result = geneva.run(["!if", false, 42]);
        expect(result).to.equal(null);
      });
    });
  });
});
